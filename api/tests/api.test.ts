const API_BASE = 'http://localhost:3001/api';

async function request(path: string, options: RequestInit = {}) {
  const mergedHeaders = new Headers(options.headers);
  if (!mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: mergedHeaders
  });
  const data = await res.json();
  return { status: res.status, data };
}

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

async function seedData() {
  console.log('🌱 填充示例数据...\n');
  for (const feature of sampleFeatures) {
    await request('/features', {
      method: 'POST',
      body: JSON.stringify(feature),
      headers: { 'X-Operator': 'seed_script' }
    });
  }
  console.log(`✅ 已创建 ${sampleFeatures.length} 个示例特性\n`);
}

async function runTests() {
  console.log('🧪 开始测试 API...\n');

  await seedData();

  console.log('📋 测试1: 健康检查');
  const health = await request('/health');
  console.log(`  状态: ${health.status}`);
  console.log(`  ✅ ${health.status === 200 && health.data.status === 'ok' ? '通过' : '失败'}\n`);

  console.log('📋 测试2: 获取所有特性');
  const features = await request('/features');
  console.log(`  状态: ${features.status}, 特性数量: ${features.data.data?.length || 0}`);
  console.log(`  ✅ ${features.status === 200 && features.data.data?.length > 0 ? '通过' : '失败'}\n`);

  const featureList = features.data.data;
  const firstFeature = featureList?.[0];

  if (firstFeature) {
    console.log('📋 测试3: 获取单个特性详情');
    const feature = await request(`/features/${firstFeature.id}`);
    console.log(`  状态: ${feature.status}, 特性名: ${feature.data.data?.name}`);
    console.log(`  ✅ ${feature.status === 200 && feature.data.data?.key === firstFeature.key ? '通过' : '失败'}\n`);

    console.log('📋 测试4: 获取统计数据');
    const stats = await request('/features/stats');
    console.log(`  状态: ${stats.status}`);
    console.log(`  总特性数: ${stats.data.data?.total}`);
    console.log(`  生产环境: 活跃=${stats.data.data?.byEnvironment?.production?.active}, 灰度=${stats.data.data?.byEnvironment?.production?.gradual}, 禁用=${stats.data.data?.byEnvironment?.production?.disabled}`);
    console.log(`  ✅ ${stats.status === 200 && stats.data.data?.total > 0 ? '通过' : '失败'}\n`);

    console.log('📋 测试5: 客户端查询 - 白名单用户');
    const eval1 = await request(`/evaluate?featureKey=new_user_onboarding_v2&userId=product_manager&environment=production`);
    console.log(`  状态: ${eval1.status}`);
    console.log(`  白名单用户 product_manager: enabled=${eval1.data.data?.enabled}, reason=${eval1.data.data?.reason}`);
    console.log(`  ✅ ${eval1.status === 200 && eval1.data.data?.enabled === true && eval1.data.data?.reason === 'whitelist' ? '通过' : '失败'}\n`);

    console.log('📋 测试6: 客户端查询 - 灰度用户');
    const eval2 = await request(`/evaluate?featureKey=ai_recommendation_engine&userId=random_user_123&environment=production`);
    console.log(`  状态: ${eval2.status}`);
    console.log(`  普通用户: enabled=${eval2.data.data?.enabled}, reason=${eval2.data.data?.reason}`);
    console.log(`  ✅ ${eval2.status === 200 && ['rollout', 'disabled'].includes(eval2.data.data?.reason) ? '通过' : '失败'}\n`);

    console.log('📋 测试7: 客户端查询 - 禁用特性');
    const eval3 = await request(`/evaluate?featureKey=realtime_notifications&userId=any_user&environment=production`);
    console.log(`  状态: ${eval3.status}`);
    console.log(`  禁用特性: enabled=${eval3.data.data?.enabled}, reason=${eval3.data.data?.reason}`);
    console.log(`  ✅ ${eval3.status === 200 && eval3.data.data?.enabled === false && eval3.data.data?.reason === 'disabled' ? '通过' : '失败'}\n`);

    console.log('📋 测试8: 批量查询');
    const eval4 = await request(`/evaluate/batch?featureKeys=dark_mode_support,new_user_onboarding_v2,ai_recommendation_engine&userId=test_user&environment=production`);
    console.log(`  状态: ${eval4.status}`);
    console.log(`  返回结果数: ${eval4.data.data?.length}`);
    eval4.data.data?.forEach((r: any) => {
      console.log(`    ${r.featureKey}: enabled=${r.enabled}, reason=${r.reason}`);
    });
    console.log(`  ✅ ${eval4.status === 200 && eval4.data.data?.length === 3 ? '通过' : '失败'}\n`);

    console.log('📋 测试9: 查询所有特性状态');
    const eval5 = await request(`/evaluate/all?userId=test_user_999&environment=testing`);
    console.log(`  状态: ${eval5.status}`);
    console.log(`  返回结果数: ${eval5.data.data?.length}`);
    console.log(`  ✅ ${eval5.status === 200 && eval5.data.data?.length > 0 ? '通过' : '失败'}\n`);

    console.log('📋 测试10: 创建新特性');
    const newFeature = {
      name: '测试特性',
      key: 'test_feature_api',
      description: '这是一个通过 API 创建的测试特性',
      environments: {
        development: { enabled: true, rolloutPercentage: 100, whitelist: [] },
        testing: { enabled: true, rolloutPercentage: 50, whitelist: ['tester1'] },
        production: { enabled: false, rolloutPercentage: 0, whitelist: [] }
      }
    };
    const created = await request('/features', {
      method: 'POST',
      body: JSON.stringify(newFeature),
      headers: { 'X-Operator': 'api_tester' }
    });
    console.log(`  状态: ${created.status}`);
    console.log(`  创建的特性: ${created.data.data?.name} (${created.data.data?.key})`);
    console.log(`  ✅ ${created.status === 201 && created.data.data?.key === 'test_feature_api' ? '通过' : '失败'}\n`);

    const newFeatureId = created.data.data?.id;

    if (newFeatureId) {
      console.log('📋 测试11: 更新特性');
      const updated = await request(`/features/${newFeatureId}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: '更新后的描述',
          environments: {
            production: { enabled: true, rolloutPercentage: 10 }
          }
        }),
        headers: { 'X-Operator': 'api_tester' }
      });
      console.log(`  状态: ${updated.status}`);
      console.log(`  新描述: ${updated.data.data?.description}`);
      console.log(`  生产环境: enabled=${updated.data.data?.environments?.production?.enabled}, ${updated.data.data?.environments?.production?.rolloutPercentage}%`);
      console.log(`  ✅ ${updated.status === 200 && updated.data.data?.environments?.production?.rolloutPercentage === 10 ? '通过' : '失败'}\n`);

      console.log('📋 测试12: 获取特性变更历史');
      const history = await request(`/features/${newFeatureId}/history`);
      console.log(`  状态: ${history.status}`);
      console.log(`  历史记录数: ${history.data.data?.length}`);
      history.data.data?.forEach((h: any) => {
        console.log(`    ${h.operation} by ${h.operator}`);
      });
      console.log(`  ✅ ${history.status === 200 && history.data.data?.length >= 2 ? '通过' : '失败'}\n`);

      console.log('📋 测试13: 删除特性');
      const deleted = await request(`/features/${newFeatureId}`, {
        method: 'DELETE',
        headers: { 'X-Operator': 'api_tester' }
      });
      console.log(`  状态: ${deleted.status}`);
      console.log(`  消息: ${deleted.data.message}`);
      console.log(`  ✅ ${deleted.status === 200 ? '通过' : '失败'}\n`);
    }

    console.log('📋 测试14: 获取全局历史记录');
    const globalHistory = await request('/history');
    console.log(`  状态: ${globalHistory.status}`);
    console.log(`  总记录数: ${globalHistory.data?.pagination?.total || globalHistory.data?.data?.length || 0}`);
    console.log(`  ✅ ${globalHistory.status === 200 ? '通过' : '失败'}\n`);

    console.log('📋 测试15: 灰度分布模拟');
    const simulate = await request(`/evaluate/simulate?featureKey=simulate_test&percentage=25&sampleSize=1000`);
    console.log(`  状态: ${simulate.status}`);
    console.log(`  模拟结果: 启用=${simulate.data.data?.enabled}, 禁用=${simulate.data.data?.disabled}, 实际比例=${simulate.data.data?.percentage}%`);
    console.log(`  ✅ ${simulate.status === 200 && Math.abs(simulate.data.data?.percentage - 25) < 5 ? '通过' : '失败'}\n`);

    console.log('📋 测试16: 获取用户Bucket');
    const bucket = await request(`/evaluate/bucket?userId=test_user_123&featureKey=ai_recommendation_engine`);
    console.log(`  状态: ${bucket.status}`);
    console.log(`  用户Bucket: ${bucket.data.data?.bucket}/100`);
    console.log(`  ✅ ${bucket.status === 200 && bucket.data.data?.bucket >= 1 && bucket.data.data?.bucket <= 100 ? '通过' : '失败'}\n`);

    console.log('📋 测试17: 重复创建相同Key (应失败)');
    const duplicate = await request('/features', {
      method: 'POST',
      body: JSON.stringify({
        name: '重复测试',
        key: 'dark_mode_support',
        description: '应该失败',
        environments: {}
      }),
      headers: { 'X-Operator': 'api_tester' }
    });
    console.log(`  状态: ${duplicate.status}`);
    console.log(`  错误: ${duplicate.data.error}`);
    console.log(`  ✅ ${duplicate.status === 409 ? '通过 (返回409冲突)' : '失败'}\n`);

    console.log('📋 测试18: 无效环境参数');
    const invalidEnv = await request(`/evaluate?featureKey=dark_mode_support&userId=test&environment=invalid_env`);
    console.log(`  状态: ${invalidEnv.status}`);
    console.log(`  错误: ${invalidEnv.data.error}`);
    console.log(`  ✅ ${invalidEnv.status === 400 ? '通过 (返回400错误)' : '失败'}\n`);
  }

  console.log('🎉 API 测试完成！');
}

runTests().catch(console.error);
