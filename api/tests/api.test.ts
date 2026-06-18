import { createApiClient, buildApiRequest } from '../lib/apiRequestHelper.js';
import type { ApiResponse } from '../lib/apiRequestHelper.js';

const API_BASE = 'http://localhost:3001/api';
const client = createApiClient(API_BASE);

const sampleFeatures = [
  {
    name: '新用户引导流程 V2',
    key: 'new_user_onboarding_v2',
    description: '新版用户注册引导流程，包含社交账号登录和个性化推荐',
    environments: {
      development: { enabled: true, rolloutPercentage: 100, whitelist: [] },
      testing: { enabled: true, rolloutPercentage: 50, whitelist: ['test_user_001', 'test_user_002', 'qa_team'] },
      production: { enabled: true, rolloutPercentage: 10, whitelist: ['product_manager', 'ceo'] }
    }
  },
  {
    name: 'AI 智能推荐系统',
    key: 'ai_recommendation_engine',
    description: '基于用户行为的个性化内容推荐算法',
    environments: {
      development: { enabled: true, rolloutPercentage: 100, whitelist: [] },
      testing: { enabled: true, rolloutPercentage: 100, whitelist: [] },
      production: { enabled: true, rolloutPercentage: 30, whitelist: ['beta_tester_001', 'beta_tester_002'] }
    }
  },
  {
    name: '暗黑模式',
    key: 'dark_mode_support',
    description: '支持系统级暗黑模式自动切换',
    environments: {
      development: { enabled: true, rolloutPercentage: 100, whitelist: [] },
      testing: { enabled: true, rolloutPercentage: 100, whitelist: [] },
      production: { enabled: true, rolloutPercentage: 100, whitelist: [] }
    }
  },
  {
    name: '实时通知系统',
    key: 'realtime_notifications',
    description: '基于 WebSocket 的实时消息推送系统',
    environments: {
      development: { enabled: true, rolloutPercentage: 100, whitelist: [] },
      testing: { enabled: true, rolloutPercentage: 80, whitelist: ['dev_ops'] },
      production: { enabled: false, rolloutPercentage: 0, whitelist: [] }
    }
  },
  {
    name: '支付流程优化',
    key: 'checkout_flow_optimization',
    description: '简化支付流程，支持更多支付方式',
    environments: {
      development: { enabled: true, rolloutPercentage: 100, whitelist: [] },
      testing: { enabled: false, rolloutPercentage: 0, whitelist: [] },
      production: { enabled: false, rolloutPercentage: 0, whitelist: [] }
    }
  }
];

function printResult(testName: string, passed: boolean, extra?: string) {
  console.log(`📋 ${testName}`);
  if (extra) console.log(`  ${extra}`);
  console.log(`  ${passed ? '✅ 通过' : '❌ 失败'}\n`);
}

async function seedData() {
  console.log('🌱 填充示例数据...\n');
  for (const feature of sampleFeatures) {
    await client.post('/features', feature, { headers: { 'X-Operator': 'seed_script' } });
  }
  console.log(`✅ 已创建 ${sampleFeatures.length} 个示例特性\n`);
}

async function testVariousRequestStyles() {
  console.log('🧪 测试多种请求封装方式的一致性...\n');

  const testFeatureBase = {
    name: '请求方式测试',
    description: '测试不同请求封装方式',
    environments: {
      development: { enabled: true, rolloutPercentage: 100, whitelist: [] },
      testing: { enabled: false, rolloutPercentage: 0, whitelist: [] },
      production: { enabled: false, rolloutPercentage: 0, whitelist: [] }
    }
  };

  console.log('--- 测试1: client.post() 直接传对象 ---');
  let feat1: ApiResponse | null = null;
  try {
    feat1 = await client.post('/features', {
      ...testFeatureBase,
      key: 'req_style_1_client_post'
    }, { headers: { 'X-Operator': 'tester' } });
    console.log(`  状态: ${feat1.status}, 创建成功: ${feat1.data.data?.key === 'req_style_1_client_post'}`);
    console.log(`  ✅ 通过\n`);
  } catch (e: any) {
    console.log(`  错误: ${e.message}`);
    console.log(`  ❌ 失败\n`);
  }

  console.log('--- 测试2: fetch + 对象展开 headers (旧问题方式) ---');
  try {
    const bodyObj = { ...testFeatureBase, key: 'req_style_2_fetch_spread' };
    const res = await fetch(`${API_BASE}/features`, {
      method: 'POST',
      headers: {
        'X-Operator': 'tester',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyObj)
    });
    const data = await res.json();
    const ok = res.status === 201 && data.data?.key === 'req_style_2_fetch_spread';
    console.log(`  状态: ${res.status}, 创建成功: ${data.data?.key === 'req_style_2_fetch_spread'}`);
    console.log(`  ${ok ? '✅ 通过' : '❌ 失败'}\n`);
  } catch (e: any) {
    console.log(`  错误: ${e.message}`);
    console.log(`  ❌ 失败\n`);
  }

  console.log('--- 测试3: Headers 实例方式 ---');
  try {
    const headers = new Headers();
    headers.set('X-Operator', 'tester');
    const res = await fetch(`${API_BASE}/features`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...testFeatureBase, key: 'req_style_3_headers_instance' })
    });
    const data = await res.json();
    const ok = res.status === 201 && data.data?.key === 'req_style_3_headers_instance';
    console.log(`  状态: ${res.status}, 创建成功: ${data.data?.key === 'req_style_3_headers_instance'}`);
    console.log(`  ${ok ? '✅ 通过' : '❌ 失败'}\n`);
  } catch (e: any) {
    console.log(`  错误: ${e.message}`);
    console.log(`  ❌ 失败\n`);
  }

  console.log('--- 测试4: buildApiRequest 方式 ---');
  try {
    const { url, init } = buildApiRequest(`${API_BASE}/features`, {
      method: 'POST',
      body: { ...testFeatureBase, key: 'req_style_4_build_helper' },
      headers: { 'X-Operator': 'tester' } as Record<string, string>
    });
    const res = await fetch(url, init);
    const data = await res.json();
    const ok = res.status === 201 && data.data?.key === 'req_style_4_build_helper';
    console.log(`  状态: ${res.status}, 创建成功: ${data.data?.key === 'req_style_4_build_helper'}`);
    console.log(`  ${ok ? '✅ 通过' : '❌ 失败'}\n`);
  } catch (e: any) {
    console.log(`  错误: ${e.message}`);
    console.log(`  ❌ 失败\n`);
  }

  console.log('--- 测试5: 无 Content-Type header (后端自动识别) ---');
  try {
    const res = await fetch(`${API_BASE}/features`, {
      method: 'POST',
      headers: { 'X-Operator': 'tester' },
      body: JSON.stringify({ ...testFeatureBase, key: 'req_style_5_no_ct' })
    });
    const data = await res.json();
    const ok = res.status === 201 && data.data?.key === 'req_style_5_no_ct';
    console.log(`  状态: ${res.status}, 创建成功: ${data.data?.key === 'req_style_5_no_ct'}`);
    console.log(`  ${ok ? '✅ 通过' : '❌ 失败'}\n`);
  } catch (e: any) {
    console.log(`  错误: ${e.message}`);
    console.log(`  ❌ 失败\n`);
  }

  console.log('--- 测试6: Content-Type 带 charset ---');
  try {
    const res = await fetch(`${API_BASE}/features`, {
      method: 'POST',
      headers: {
        'X-Operator': 'tester',
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ ...testFeatureBase, key: 'req_style_6_ct_charset' })
    });
    const data = await res.json();
    const ok = res.status === 201 && data.data?.key === 'req_style_6_ct_charset';
    console.log(`  状态: ${res.status}, 创建成功: ${data.data?.key === 'req_style_6_ct_charset'}`);
    console.log(`  ${ok ? '✅ 通过' : '❌ 失败'}\n`);
  } catch (e: any) {
    console.log(`  错误: ${e.message}`);
    console.log(`  ❌ 失败\n`);
  }

  console.log('--- 测试7: client.put() 更新特性 ---');
  if (feat1 && feat1.data.data?.id) {
    try {
      const updated = await client.put(`/features/${feat1.data.data.id}`, {
        description: '更新后的描述',
        environments: {
          production: { enabled: true, rolloutPercentage: 25 }
        }
      }, { headers: { 'X-Operator': 'tester' } });
      const ok = updated.status === 200 && updated.data.data?.environments?.production?.rolloutPercentage === 25;
      console.log(`  状态: ${updated.status}, 更新成功: ${ok}`);
      console.log(`  新描述: ${updated.data.data?.description}`);
      console.log(`  生产灰度: ${updated.data.data?.environments?.production?.rolloutPercentage}%`);
      console.log(`  ${ok ? '✅ 通过' : '❌ 失败'}\n`);
    } catch (e: any) {
      console.log(`  错误: ${e.message}`);
      console.log(`  ❌ 失败\n`);
    }
  }

  console.log('--- 测试8: 验证所有创建的特性 ---');
  try {
    const list = await client.get('/features');
    const createdKeys = list.data.data?.filter((f: any) => f.key.startsWith('req_style_')).map((f: any) => f.key) || [];
    const expectedCount = 6;
    const ok = createdKeys.length >= expectedCount;
    console.log(`  找到 req_style_* 特性: ${createdKeys.length} 个`);
    createdKeys.forEach((k: string) => console.log(`    - ${k}`));
    console.log(`  ${ok ? '✅ 通过 (>=6个)' : `❌ 失败 (期望>=${expectedCount})`}\n`);
  } catch (e: any) {
    console.log(`  错误: ${e.message}`);
    console.log(`  ❌ 失败\n`);
  }

  console.log('🎉 多种请求方式测试完成！\n');
}

async function runFullTests() {
  console.log('🧪 开始完整 API 测试...\n');

  await seedData();

  printResult('测试1: 健康检查',
    (await client.get('/health')).status === 200);

  const featuresRes = await client.get('/features');
  printResult('测试2: 获取所有特性',
    featuresRes.status === 200 && featuresRes.data.data?.length > 0,
    `特性数量: ${featuresRes.data.data?.length || 0}`);

  const firstFeature = featuresRes.data.data?.[0];
  if (!firstFeature) {
    console.log('⚠️  无特性可测试，跳过后续测试');
    return;
  }

  const detailRes = await client.get(`/features/${firstFeature.id}`);
  printResult('测试3: 获取单个特性详情',
    detailRes.status === 200 && detailRes.data.data?.key === firstFeature.key,
    `特性名: ${detailRes.data.data?.name}`);

  const statsRes = await client.get('/features/stats');
  printResult('测试4: 获取统计数据',
    statsRes.status === 200 && statsRes.data.data?.total > 0,
    `总特性数: ${statsRes.data.data?.total}, 生产环境: 活跃=${statsRes.data.data?.byEnvironment?.production?.active}, 灰度=${statsRes.data.data?.byEnvironment?.production?.gradual}, 禁用=${statsRes.data.data?.byEnvironment?.production?.disabled}`);

  const eval1Res = await client.get(`/evaluate?featureKey=new_user_onboarding_v2&userId=product_manager&environment=production`);
  printResult('测试5: 客户端查询 - 白名单用户',
    eval1Res.status === 200 && eval1Res.data.data?.enabled === true && eval1Res.data.data?.reason === 'whitelist',
    `白名单用户 product_manager: enabled=${eval1Res.data.data?.enabled}, reason=${eval1Res.data.data?.reason}`);

  const eval2Res = await client.get(`/evaluate?featureKey=ai_recommendation_engine&userId=random_user_123&environment=production`);
  printResult('测试6: 客户端查询 - 灰度用户',
    eval2Res.status === 200 && ['rollout', 'disabled'].includes(eval2Res.data.data?.reason),
    `普通用户: enabled=${eval2Res.data.data?.enabled}, reason=${eval2Res.data.data?.reason}`);

  const eval3Res = await client.get(`/evaluate?featureKey=realtime_notifications&userId=any_user&environment=production`);
  printResult('测试7: 客户端查询 - 禁用特性',
    eval3Res.status === 200 && eval3Res.data.data?.enabled === false && eval3Res.data.data?.reason === 'disabled',
    `禁用特性: enabled=${eval3Res.data.data?.enabled}, reason=${eval3Res.data.data?.reason}`);

  const eval4Res = await client.get(`/evaluate/batch?featureKeys=dark_mode_support,new_user_onboarding_v2,ai_recommendation_engine&userId=test_user&environment=production`);
  printResult('测试8: 批量查询',
    eval4Res.status === 200 && eval4Res.data.data?.length === 3,
    `返回结果数: ${eval4Res.data.data?.length}`);

  const eval5Res = await client.get(`/evaluate/all?userId=test_user_999&environment=testing`);
  printResult('测试9: 查询所有特性状态',
    eval5Res.status === 200 && eval5Res.data.data?.length > 0,
    `返回结果数: ${eval5Res.data.data?.length}`);

  const newFeature = {
    name: '测试特性',
    key: 'test_feature_api_full',
    description: '这是一个通过 API 创建的测试特性',
    environments: {
      development: { enabled: true, rolloutPercentage: 100, whitelist: [] },
      testing: { enabled: true, rolloutPercentage: 50, whitelist: ['tester1'] },
      production: { enabled: false, rolloutPercentage: 0, whitelist: [] }
    }
  };
  const created = await client.post('/features', newFeature, { headers: { 'X-Operator': 'api_tester' } });
  printResult('测试10: 创建新特性',
    created.status === 201 && created.data.data?.key === 'test_feature_api_full',
    `创建的特性: ${created.data.data?.name} (${created.data.data?.key})`);

  const newFeatureId = created.data.data?.id;
  if (newFeatureId) {
    const updated = await client.put(`/features/${newFeatureId}`, {
      description: '更新后的描述',
      environments: {
        production: { enabled: true, rolloutPercentage: 10 }
      }
    }, { headers: { 'X-Operator': 'api_tester' } });
    printResult('测试11: 更新特性',
      updated.status === 200 && updated.data.data?.environments?.production?.rolloutPercentage === 10,
      `新描述: ${updated.data.data?.description}, 生产环境: enabled=${updated.data.data?.environments?.production?.enabled}, ${updated.data.data?.environments?.production?.rolloutPercentage}%`);

    const history = await client.get(`/features/${newFeatureId}/history`);
    printResult('测试12: 获取特性变更历史',
      history.status === 200 && history.data.data?.length >= 2,
      `历史记录数: ${history.data.data?.length}`);

    const deleted = await client.delete(`/features/${newFeatureId}`, { headers: { 'X-Operator': 'api_tester' } } as any);
    printResult('测试13: 删除特性',
      deleted.status === 200,
      `消息: ${deleted.data.message}`);
  }

  const globalHistory = await client.get('/history');
  printResult('测试14: 获取全局历史记录',
    globalHistory.status === 200,
    `总记录数: ${globalHistory.data?.pagination?.total || globalHistory.data?.data?.length || 0}`);

  const simulate = await client.get('/evaluate/simulate?featureKey=simulate_test&percentage=25&sampleSize=1000');
  printResult('测试15: 灰度分布模拟',
    simulate.status === 200 && Math.abs(simulate.data.data?.percentage - 25) < 5,
    `模拟结果: 启用=${simulate.data.data?.enabled}, 禁用=${simulate.data.data?.disabled}, 实际比例=${simulate.data.data?.percentage}%`);

  const bucket = await client.get('/evaluate/bucket?userId=test_user_123&featureKey=ai_recommendation_engine');
  printResult('测试16: 获取用户Bucket',
    bucket.status === 200 && bucket.data.data?.bucket >= 1 && bucket.data.data?.bucket <= 100,
    `用户Bucket: ${bucket.data.data?.bucket}/100`);

  try {
    await client.post('/features', {
      name: '重复测试',
      key: 'dark_mode_support',
      description: '应该失败',
      environments: {}
    }, { headers: { 'X-Operator': 'api_tester' } });
    printResult('测试17: 重复创建相同Key (应失败)', false);
  } catch (e: any) {
    printResult('测试17: 重复创建相同Key (应失败)',
      e.status === 409,
      `状态码: ${e.status}, 错误: ${e.message}`);
  }

  try {
    await client.get('/evaluate?featureKey=dark_mode_support&userId=test&environment=invalid_env');
    printResult('测试18: 无效环境参数', false);
  } catch (e: any) {
    printResult('测试18: 无效环境参数',
      e.status === 400,
      `状态码: ${e.status}, 错误: ${e.message}`);
  }

  console.log('🎉 完整 API 测试完成！\n');
}

async function main() {
  await runFullTests();
  await testVariousRequestStyles();
  console.log('🏁 所有测试已完成！');
}

main().catch(console.error);
