import { isUserInRollout, evaluateFeature, getBucket } from '../lib/rollout.js';
import type { Environment, EnvironmentConfig } from '../../shared/types.js';

console.log('🧪 开始测试灰度发布算法...\n');

function testConsistency() {
  console.log('测试1: 一致性哈希 - 同一用户应始终获得相同结果');
  const featureKey = 'test_feature';
  const userId = 'user_12345';
  const percentage = 50;

  const results: boolean[] = [];
  for (let i = 0; i < 10; i++) {
    results.push(isUserInRollout(userId, percentage, featureKey));
  }

  const allSame = results.every((r) => r === results[0]);
  console.log(`  同一用户多次调用结果一致: ${allSame ? '✅ 通过' : '❌ 失败'}`);
  console.log(`  结果: ${results.map((r) => (r ? 'T' : 'F')).join(', ')}\n`);
}

function testBoundaryConditions() {
  console.log('测试2: 边界条件');

  const userId = 'test_user';
  const featureKey = 'test_feature';

  const r1 = isUserInRollout(userId, 0, featureKey);
  console.log(`  0% 灰度: ${!r1 ? '✅ 通过 (返回 false)' : '❌ 失败 (返回 true)'}`);

  const r2 = isUserInRollout(userId, 100, featureKey);
  console.log(`  100% 灰度: ${r2 ? '✅ 通过 (返回 true)' : '❌ 失败 (返回 false)'}`);

  const r3 = isUserInRollout(userId, 101, featureKey);
  console.log(`  101% 灰度: ${r3 ? '✅ 通过 (返回 true)' : '❌ 失败 (返回 false)'}`);

  const r4 = isUserInRollout(userId, -1, featureKey);
  console.log(`  -1% 灰度: ${!r4 ? '✅ 通过 (返回 false)' : '❌ 失败 (返回 true)'}\n`);
}

function testDistribution() {
  console.log('测试3: 分布均匀性 - 1000 个用户在 30% 灰度下的分布');

  const featureKey = 'distribution_test';
  const percentage = 30;
  const sampleSize = 1000;

  let enabled = 0;
  for (let i = 0; i < sampleSize; i++) {
    if (isUserInRollout(`user_${i}`, percentage, featureKey)) {
      enabled++;
    }
  }

  const actualPercentage = (enabled / sampleSize) * 100;
  const diff = Math.abs(actualPercentage - percentage);
  const passed = diff < 5;

  console.log(`  启用用户数: ${enabled}/${sampleSize}`);
  console.log(`  实际比例: ${actualPercentage.toFixed(1)}% (目标: ${percentage}%)`);
  console.log(`  偏差: ${diff.toFixed(1)}% ${passed ? '✅ 通过 (<5%)' : '❌ 失败 (>=5%)'}\n`);
}

function testDifferentFeatures() {
  console.log('测试4: 不同特性的独立性');

  const userId = 'same_user_123';
  const percentage = 50;

  const features = ['feature_a', 'feature_b', 'feature_c', 'feature_d', 'feature_e'];
  const results = features.map((f) => isUserInRollout(userId, percentage, f));

  const uniqueResults = new Set(results).size;
  console.log(`  同一用户在5个不同特性中的结果: ${results.map((r) => (r ? 'T' : 'F')).join(', ')}`);
  console.log(`  存在不同结果: ${uniqueResults > 1 ? '✅ 通过' : '⚠️  警告: 全部相同(可能但不影响功能)'}\n`);
}

function testBucketDistribution() {
  console.log('测试5: Bucket 分布');

  const featureKey = 'bucket_test';
  const buckets: number[] = [];

  for (let i = 0; i < 1000; i++) {
    buckets.push(getBucket(`user_${i}`, featureKey));
  }

  const inRange = buckets.every((b) => b >= 1 && b <= 100);
  console.log(`  所有 bucket 在 1-100 范围内: ${inRange ? '✅ 通过' : '❌ 失败'}`);

  const avg = buckets.reduce((a, b) => a + b, 0) / buckets.length;
  console.log(`  Bucket 平均值: ${avg.toFixed(2)} (期望 ~50.5)`);
  console.log(`  平均值接近预期: ${Math.abs(avg - 50.5) < 5 ? '✅ 通过' : '⚠️  偏差较大'}\n`);
}

function testEvaluateFeature() {
  console.log('测试6: 完整的特性评估逻辑');

  const userId = 'user_789';
  const whitelistUserId = 'vip_user_001';
  const featureKey = 'eval_test';
  const environment: Environment = 'production';

  const disabledConfig: EnvironmentConfig = {
    enabled: false,
    rolloutPercentage: 100,
    whitelist: [whitelistUserId]
  };

  const r1 = evaluateFeature(userId, featureKey, environment, disabledConfig);
  console.log(`  特性禁用时: enabled=${r1.enabled}, reason=${r1.reason}`);
  console.log(`    ${r1.enabled === false && r1.reason === 'disabled' ? '✅ 通过' : '❌ 失败'}`);

  const whitelistConfig: EnvironmentConfig = {
    enabled: true,
    rolloutPercentage: 0,
    whitelist: [whitelistUserId]
  };

  const r2 = evaluateFeature(whitelistUserId, featureKey, environment, whitelistConfig);
  console.log(`  白名单用户 0% 灰度: enabled=${r2.enabled}, reason=${r2.reason}`);
  console.log(`    ${r2.enabled === true && r2.reason === 'whitelist' ? '✅ 通过' : '❌ 失败'}`);

  const r3 = evaluateFeature(userId, featureKey, environment, whitelistConfig);
  console.log(`  非白名单用户 0% 灰度: enabled=${r3.enabled}, reason=${r3.reason}`);
  console.log(`    ${r3.enabled === false && r3.reason === 'disabled' ? '✅ 通过' : '❌ 失败'}`);

  const r4 = evaluateFeature('unknown_user', 'unknown_feature', environment, null);
  console.log(`  特性不存在时: enabled=${r4.enabled}, reason=${r4.reason}`);
  console.log(`    ${r4.enabled === false && r4.reason === 'not-found' ? '✅ 通过' : '❌ 失败'}\n`);
}

function runAllTests() {
  testConsistency();
  testBoundaryConditions();
  testDistribution();
  testDifferentFeatures();
  testBucketDistribution();
  testEvaluateFeature();

  console.log('🎉 所有测试完成！');
}

runAllTests();
