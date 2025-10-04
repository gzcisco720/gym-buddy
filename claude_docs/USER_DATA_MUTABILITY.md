# 用户数据可变性分析

本文档分析 gym-buddy 系统中用户数据的可变性（Mutability），区分哪些数据是可变的（应该定期更新），哪些是不可变的（几乎不会改变）。

## 数据分类

### 🔒 不可变数据（Immutable Data）

这些数据一旦设置后，几乎不会改变或改变频率极低。

#### 1. 性别 (Gender)
- **字段**: `gender`
- **类型**: `'male' | 'female' | 'other'`
- **可变性**: ❌ **不可变**
- **原因**:
  - 用于代谢率计算的生理性别通常不变
  - 如果用户需要修改，应该是极少数情况
- **建议**:
  - 允许修改，但需要确认提示
  - 修改后重新计算所有基于性别的指标

#### 2. 出生日期 (Date of Birth)
- **字段**: `dateOfBirth`
- **类型**: `Date`
- **可变性**: ❌ **不可变**
- **原因**:
  - 生理年龄不会改变（只会随时间自动增长）
  - 用于计算实际年龄
- **建议**:
  - 只允许在初次设置时填写
  - 如发现错误可修改，但需要管理员权限或验证
  - **优化建议**: 存储 `dateOfBirth` 而不是 `age`，系统自动计算年龄

#### 3. 身高 (Height)
- **字段**: `fitnessProfile.height`
- **类型**: `number` (cm)
- **可变性**: ⚠️ **几乎不可变**
- **原因**:
  - 成年后身高基本不变
  - 只在青少年阶段或特殊情况下会改变
- **更新频率**:
  - 成年人：几乎不需要更新
  - 青少年（< 18岁）：每 6-12 个月测量更新
- **建议**:
  - 允许修改，但不强制定期更新
  - 对 18 岁以下用户可提示定期更新

---

### 🔄 可变数据 - 慢变化（Slowly Changing Data）

这些数据会改变，但变化缓慢，更新频率为月/季度级别。

#### 4. 训练水平 (Training Level)
- **字段**: `fitnessProfile.trainingLevel`
- **类型**: `'beginner' | 'intermediate' | 'advanced' | 'elite'`
- **可变性**: ✅ **可变（慢）**
- **变化周期**: 3-6 个月
- **原因**:
  - 训练经验随时间积累
  - beginner → intermediate（6个月-1年）
  - intermediate → advanced（1-3年）
  - advanced → elite（2-5年）
- **更新建议**:
  - 每 3-6 个月提醒用户审查
  - 基于 1RM 进步自动建议升级
  - 结合训练年限自动推断

#### 5. 活动水平 (Activity Level)
- **字段**: `fitnessProfile.activityLevel`
- **类型**: `'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'extraActive'`
- **可变性**: ✅ **可变（中等）**
- **变化周期**: 1-3 个月
- **原因**:
  - 生活方式、工作性质可能改变
  - 训练频率增加/减少
- **更新建议**:
  - 每月提醒用户审查
  - 重新计算 TDEE（总日常能量消耗）
  - 影响营养建议和卡路里摄入

#### 6. 训练年限 (Training Years)
- **字段**: `fitnessProfile.trainingYears`
- **类型**: `number`
- **可变性**: ✅ **可变（线性增长）**
- **变化周期**: 持续增长
- **原因**:
  - 随时间线性增加
  - 可能因中断训练而停滞或减少
- **更新建议**:
  - 每 6-12 个月更新
  - 或者基于首次训练日期自动计算

---

### 📊 可变数据 - 快变化（Frequently Changing Data）

这些数据会频繁变化，需要定期跟踪和更新。

#### 7. 体重 (Weight)
- **字段**: `fitnessProfile.weight`
- **类型**: `number` (kg)
- **可变性**: ✅ **高度可变**
- **变化周期**: 每周/每日
- **原因**:
  - 减脂/增肌训练会改变体重
  - 饮食、水分摄入影响体重
  - 是最重要的进度追踪指标
- **更新建议**:
  - **每周测量并记录**（推荐：周一早晨空腹）
  - 保存历史记录用于趋势分析
  - 使用体重曲线而不是单次数值
- **数据模型建议**:
  ```typescript
  // 当前体重
  currentWeight: number;

  // 体重历史记录（单独表）
  weightHistory: [
    { weight: 70.5, measuredAt: Date, notes: string }
  ]
  ```

#### 8. 体脂率 (Body Fat Percentage)
- **字段**: `fitnessProfile.bodyFatPercentage`
- **类型**: `number` (%)
- **可变性**: ✅ **可变（中等）**
- **变化周期**: 每月
- **原因**:
  - 减脂/增肌训练会改变体脂率
  - 变化慢于体重（更稳定的指标）
- **更新建议**:
  - **每月测量并记录**（同一测量方法保持一致性）
  - 不建议每周测量（测量误差可能大于实际变化）
  - 保存历史记录
- **注意**:
  - 测量方法一致性很重要（BIA/皮褶/DEXA）
  - 不同方法结果不可直接比较

#### 9. 瘦体重 (Lean Body Mass)
- **字段**: `fitnessProfile.leanBodyMass`
- **类型**: `number` (kg)
- **可变性**: ✅ **可变（中等）**
- **变化周期**: 每月（自动计算）
- **原因**:
  - 基于体重和体脂率计算
  - 增肌训练会增加 LBM
- **计算公式**:
  ```typescript
  LBM = weight - (weight × bodyFatPercentage / 100)
  ```
- **更新建议**:
  - **不需要手动输入**，应该自动计算
  - 体重或体脂率更新时自动重新计算
  - 保存历史记录

#### 10. 年龄 (Age)
- **字段**: `fitnessProfile.age`
- **类型**: `number`
- **可变性**: ✅ **可变（自动）**
- **变化周期**: 每年（生日）
- **原因**:
  - 随时间自然增长
  - 影响 BMR 计算
- **优化建议**:
  - ⚠️ **不应该存储 `age`，应该存储 `dateOfBirth`**
  - 系统根据当前日期自动计算年龄
  - 避免数据过期问题
  ```typescript
  // ❌ 不推荐
  age: 25  // 一年后过期

  // ✅ 推荐
  dateOfBirth: Date('2000-01-15')
  // 计算年龄：
  const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  ```

---

## 数据更新频率总结表

| 字段 | 可变性 | 更新频率 | 推荐操作 | 是否需要历史记录 |
|------|-------|---------|---------|---------------|
| **gender** | ❌ 不可变 | 几乎不需要 | 允许修改但需确认 | ❌ 否 |
| **dateOfBirth** | ❌ 不可变 | 仅初次设置 | 初次设置后锁定 | ❌ 否 |
| **height** | ⚠️ 几乎不可变 | 青少年：6-12个月<br>成年人：几乎不需要 | 允许修改 | ❌ 否（成年人）<br>✅ 是（青少年） |
| **weight** | ✅ 高度可变 | **每周** | 定期提醒测量 | ✅ **是** |
| **bodyFatPercentage** | ✅ 可变 | **每月** | 定期提醒测量 | ✅ **是** |
| **leanBodyMass** | ✅ 可变 | 自动计算 | 体重/体脂更新时重算 | ✅ **是** |
| **age** | ✅ 自动可变 | 每年（自动） | 从 dateOfBirth 计算 | ❌ 否 |
| **trainingLevel** | ✅ 可变（慢） | 3-6 个月 | 提醒审查 + 自动建议 | ✅ 是（用于分析） |
| **activityLevel** | ✅ 可变（中） | 1-3 个月 | 提醒审查 | ✅ 是（用于分析） |
| **trainingYears** | ✅ 可变（线性） | 6-12 个月 | 从首次训练日期计算 | ❌ 否 |

---

## 推荐的数据模型优化

### 当前实现问题

```typescript
// ❌ 当前实现
fitnessProfile: {
  weight: number;              // 单一数值，无法追踪历史
  height: number;
  age: number;                 // 会过期！应该用 dateOfBirth
  bodyFatPercentage: number;   // 单一数值，无法追踪历史
  leanBodyMass: number;        // 单一数值，无法追踪历史
  // ...
}
```

### 推荐的优化方案

#### 方案 1: 分离静态和动态数据

```typescript
// 用户基础信息（几乎不变）
interface UserProfile {
  gender: 'male' | 'female' | 'other';
  dateOfBirth: Date;           // ✅ 存储出生日期，不存储年龄
  height: number;              // 成年人几乎不变

  // 训练偏好（慢变化）
  trainingLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'extraActive';

  // 元数据
  firstTrainingDate?: Date;    // ✅ 用于自动计算 trainingYears
}

// 身体成分数据（快变化，需要历史记录）
interface BodyComposition {
  userId: ObjectId;
  weight: number;
  bodyFatPercentage?: number;
  leanBodyMass?: number;       // 自动计算
  measuredAt: Date;
  measurementMethod?: 'scale' | 'BIA' | 'DEXA' | 'skinfold';
  notes?: string;
}

// 用户当前状态（虚拟字段/计算字段）
interface UserCurrentState {
  currentWeight: number;         // 从 BodyComposition 最新记录获取
  currentBodyFat: number;        // 从 BodyComposition 最新记录获取
  currentAge: number;            // 从 dateOfBirth 计算
  currentTrainingYears: number;  // 从 firstTrainingDate 计算
}
```

#### 方案 2: 使用嵌入式历史数组（MongoDB）

```typescript
interface User {
  // 静态信息
  gender: 'male' | 'female' | 'other';
  dateOfBirth: Date;

  // 动态信息 - 当前值
  currentProfile: {
    height: number;
    weight: number;
    bodyFatPercentage?: number;
    trainingLevel: string;
    activityLevel: string;
    updatedAt: Date;
  };

  // 动态信息 - 历史记录（最近 100 条）
  weightHistory: Array<{
    weight: number;
    measuredAt: Date;
  }>;

  bodyCompositionHistory: Array<{
    bodyFatPercentage: number;
    leanBodyMass: number;
    measuredAt: Date;
    method: string;
  }>;

  // 训练信息
  firstTrainingDate?: Date;
}

// 虚拟字段（getter）
userSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  return today.getFullYear() - birthDate.getFullYear();
});

userSchema.virtual('trainingYears').get(function() {
  if (!this.firstTrainingDate) return 0;
  const today = new Date();
  const startDate = new Date(this.firstTrainingDate);
  return (today - startDate) / (365.25 * 24 * 60 * 60 * 1000);
});
```

---

## 实现建议

### Phase 1: 立即优化（向后兼容）

1. **修复 age 字段**
   - 添加 `dateOfBirth` 到 User 模型
   - 保留 `fitnessProfile.age` 但标记为 deprecated
   - 创建虚拟字段自动计算年龄

   ```typescript
   // lib/models/User.ts
   UserSchema.virtual('calculatedAge').get(function() {
     if (!this.dateOfBirth) return this.fitnessProfile?.age || 0;
     const today = new Date();
     const birthDate = new Date(this.dateOfBirth);
     let age = today.getFullYear() - birthDate.getFullYear();
     const monthDiff = today.getMonth() - birthDate.getMonth();
     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
       age--;
     }
     return age;
   });
   ```

2. **添加 firstTrainingDate**
   - 在 onboarding 时询问"何时开始训练"
   - 用于自动计算 `trainingYears`

3. **创建 weight_history 集合**
   - 新建独立的 MongoDB 集合存储体重历史
   - 保留 `fitnessProfile.weight` 作为快速访问的当前值

   ```typescript
   // models/WeightHistory.ts
   interface WeightHistoryRecord {
     userId: ObjectId;
     weight: number;
     measuredAt: Date;
     notes?: string;
   }
   ```

### Phase 2: 功能增强

1. **自动提醒系统**
   - 每周一提醒用户记录体重
   - 每月提醒用户测量体脂率
   - 每季度提醒审查训练水平和活动水平

2. **趋势分析**
   - 体重变化曲线图
   - 体脂率变化趋势
   - 瘦体重增长追踪

3. **智能建议**
   - 基于 1RM 进步自动建议升级训练水平
   - 基于实际训练频率建议调整活动水平

### Phase 3: 高级优化

1. **完全分离静态和动态数据**
   - 迁移到推荐的数据模型
   - 创建独立的 body_compositions 集合

2. **数据版本控制**
   - 记录每次修改的历史
   - 支持数据回滚

---

## 用户界面建议

### 1. 设置页面分区

```
用户设置
├── 基础信息（几乎不可编辑）
│   ├── 性别 ⚠️ 修改需确认
│   ├── 出生日期 🔒 不可修改（或需管理员）
│   └── 身高 ✏️ 可编辑
│
├── 当前状态（实时显示）
│   ├── 当前年龄（自动计算）
│   ├── 当前体重 + [更新] 按钮
│   ├── 当前体脂率 + [更新] 按钮
│   └── 当前瘦体重（自动计算，灰色显示）
│
├── 训练信息（定期审查）
│   ├── 训练水平 + 💡 建议升级提示
│   ├── 活动水平
│   ├── 训练开始日期 🔒 不可修改
│   └── 训练年限（自动计算）
│
└── 历史记录（只读，图表展示）
    ├── 体重历史曲线
    ├── 体脂率历史
    └── 瘦体重变化趋势
```

### 2. 快速更新入口

在 Dashboard 显著位置添加：

```
┌─────────────────────────────────┐
│ 📊 今日身体数据                  │
├─────────────────────────────────┤
│ 体重: 70.5 kg                    │
│ 上次记录: 7天前 ⚠️               │
│ [+ 记录今日体重]                 │
└─────────────────────────────────┘
```

---

## 数据一致性规则

### 1. 自动计算字段

这些字段**永远不应该手动输入**，必须自动计算：

```typescript
// ✅ 正确：自动计算
age = calculateAge(dateOfBirth);
leanBodyMass = weight - (weight * bodyFatPercentage / 100);
trainingYears = (Date.now() - firstTrainingDate) / (365.25 * 24 * 60 * 60 * 1000);

// ❌ 错误：允许用户手动输入这些计算字段
```

### 2. 数据校验

```typescript
// 体重更新时，重新计算瘦体重
async function updateWeight(userId: string, newWeight: number) {
  const user = await User.findById(userId);

  // 更新当前体重
  user.fitnessProfile.weight = newWeight;

  // 重新计算瘦体重
  if (user.fitnessProfile.bodyFatPercentage) {
    user.fitnessProfile.leanBodyMass =
      newWeight - (newWeight * user.fitnessProfile.bodyFatPercentage / 100);
  }

  await user.save();

  // 保存历史记录
  await WeightHistory.create({
    userId: user._id,
    weight: newWeight,
    measuredAt: new Date()
  });
}
```

### 3. 级联更新

```typescript
// 体脂率更新时，必须同时更新瘦体重
async function updateBodyFat(userId: string, newBodyFat: number) {
  const user = await User.findById(userId);

  user.fitnessProfile.bodyFatPercentage = newBodyFat;

  // ⚠️ 关键：级联更新瘦体重
  user.fitnessProfile.leanBodyMass =
    user.fitnessProfile.weight - (user.fitnessProfile.weight * newBodyFat / 100);

  await user.save();
}
```

---

## 总结

### 🔒 完全不可变（1 个）
- **gender** - 性别

### ⚠️ 几乎不可变（2 个）
- **dateOfBirth** - 出生日期
- **height** - 身高（成年人）

### 🔄 慢变化（3 个）
- **trainingLevel** - 训练水平（3-6个月）
- **activityLevel** - 活动水平（1-3个月）
- **trainingYears** - 训练年限（线性增长，建议自动计算）

### 📊 快变化（3 个）
- **weight** - 体重（每周，需要历史记录）
- **bodyFatPercentage** - 体脂率（每月，需要历史记录）
- **leanBodyMass** - 瘦体重（自动计算，跟随体重和体脂变化）

### ⚙️ 自动计算（2 个）
- **age** - 年龄（从 dateOfBirth 自动计算）
- **leanBodyMass** - 瘦体重（从 weight 和 bodyFatPercentage 计算）

---

**关键建议**:
1. ✅ 立即修复：使用 `dateOfBirth` 替代 `age`
2. ✅ 立即添加：`firstTrainingDate` 用于自动计算 `trainingYears`
3. ✅ 未来优化：为 `weight` 和 `bodyFatPercentage` 创建历史记录表
4. ✅ UI 设计：明确区分不可变、慢变化、快变化字段的编辑权限

---

**文档版本**: 1.0
**创建日期**: 2025-10-02
**状态**: ✅ 完成分析
