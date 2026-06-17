import { connectDB, disconnectDB } from './lib/db.js';
import { Feature } from './models/Feature.js';

const seedData = [
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

async function seed() {
  console.log('🌱 开始填充示例数据...');
  await connectDB();

  try {
    await Feature.deleteMany({});
    console.log('🧹 已清空现有数据');

    const created = await Feature.create(seedData);
    console.log(`✅ 成功创建 ${created.length} 个特性开关:`);

    created.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (${f.key})`);
      console.log(`     开发: ${f.environments.development.enabled ? '✓' : '✗'} ${f.environments.development.rolloutPercentage}%`);
      console.log(`     测试: ${f.environments.testing.enabled ? '✓' : '✗'} ${f.environments.testing.rolloutPercentage}%`);
      console.log(`     生产: ${f.environments.production.enabled ? '✓' : '✗'} ${f.environments.production.rolloutPercentage}%`);
    });

  } catch (error) {
    console.error('❌ 填充数据失败:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }

  console.log('\n🎉 示例数据填充完成！');
}

seed();
