# PBS App Analysis & Personal Best Calculation Research

## 应用概述

这是一个名为"Recomposer"的健身训练追踪应用，专注于个人最佳记录(PB)的追踪和训练表现优化。

## 应用功能分析

### 核心功能

1. **训练计划管理**
   - 记录每周训练安排（Day 1-7）
   - 支持多种训练组合（back, thighs, shoulders等）
   - 每个训练日包含多个运动项目

2. **个人最佳记录(PB)追踪**
   - 自动计算各项运动的个人最佳成绩
   - 实时更新PB数据
   - 智能识别新纪录并祝贺用户

3. **表现监控系统**
   - 详细的运动历史记录
   - 重量/次数数据可视化
   - 等效1RM最大重量计算

### 界面结构

#### 左侧：训练计划区
- **训练日程**：显示当天训练内容（如"Day 2: back, thighs & shoulders"）
- **PB指示器**：每个运动旁显示当前PB值（如"51.3kg"用于硬拉）
- **运动列表**：
  - 运动名称
  - 目标组数和次数（如"set 1: 38 kg (goal: 13+ reps)"）
  - "max reps"标注表示该组要求做到力竭

#### 右侧：表现追踪区
- **Performance面板**：
  - 选定运动的详细数据（如Deadlift）
  - 当前训练日和组数（如"day 7: set 1"）
- **历史数据表格**：
  - 每组的重量和次数
  - 实时计算的等效1RM（如"35 kg × 12 reps = 46.7 max kg"）
- **Exercise History**：历史训练记录追踪

### PB更新机制

从截图示例可以看到完整的PB更新流程：

1. **初始设定提示**（第3张图）：
   ```
   "this is your first ever set of 'split squat-db'!
   It will establish your starting pb, and all of the weights
   your program recommends.
   please choose a moderately heavy weight, perform as many
   reps as possible and then 'save'."
   ```

2. **PB突破提示**（第4张图）：
   ```
   "congratulations!
   you just beat your personal best in 'Deadlift' by 2!
   53.3 is your new pb."
   ```
   - 显示提升幅度（+2kg）
   - 从51.3kg提升到53.3kg
   - 自动更新系统中的PB值

## PB计算公式详解

### 1. 核心概念

**Personal Best (PB)** = 特定运动项目中的最佳表现记录

PB可以表示为：
- **绝对最大重量**：单次能举起的最大重量（1RM）
- **等效最大重量**：通过多次重复计算的等效1RM
- **特定重量下的最多次数**：如80kg × 15次

### 2. 等效1RM计算公式

应用使用等效1RM作为PB的统一衡量标准。主流公式包括：

#### **Epley公式**（最常用）
```
1RM = 重量 × (1 + 0.0333 × 次数)
```

**示例**：
- 100kg × 10次 → 1RM = 100 × (1 + 0.0333 × 10) = 133.3kg

#### **Brzycki公式**
```
1RM = 重量 ÷ (1.0278 - 0.0278 × 次数)
```

**示例**：
- 100kg × 10次 → 1RM = 100 ÷ (1.0278 - 0.0278 × 10) = 133.3kg

#### **Lombardi公式**
```
1RM = 重量 × 次数^0.1
```

**示例**：
- 100kg × 10次 → 1RM = 100 × 10^0.1 = 125.9kg

#### **Lander公式**
```
1RM = (100 × 重量) ÷ (101.3 - 2.67123 × 次数)
```

#### **ACSM百分比法**
```
步骤：
1. 次数 × 2.5 = X
2. 100 - X = Y%（这是完成重量占1RM的百分比）
3. 重量 ÷ (Y/100) = 估算1RM
```

**示例**：
- 100kg × 10次
- 10 × 2.5 = 25
- 100 - 25 = 75%
- 100 ÷ 0.75 = 133.3kg

### 3. 应用实际使用的公式

从截图数据"35 kg × 12 reps = 46.7 max kg"反推：

**使用Epley公式验证**：
```
35 × (1 + 0.0333 × 12) = 35 × 1.3996 = 48.98kg ≈ 49kg
```

**使用Brzycki公式验证**：
```
35 ÷ (1.0278 - 0.0278 × 12) = 35 ÷ 0.6942 = 50.4kg
```

**实际结果**：46.7kg

**分析**：应用可能使用了：
- 修正版公式（考虑疲劳因素）
- 多公式加权平均
- 自定义的保守估算系数

### 4. 1RM百分比对照表

| 次数 | %1RM (Epley) | %1RM (Brzycki) | %1RM (通用) |
|------|--------------|----------------|-------------|
| 1    | 100%         | 100%           | 100%        |
| 2    | 94%          | 94%            | 95%         |
| 3    | 91%          | 91%            | 90%         |
| 4    | 88%          | 89%            | 88%         |
| 5    | 86%          | 86%            | 86%         |
| 6    | 83%          | 83%            | 83%         |
| 8    | 79%          | 79%            | 79%         |
| 10   | 75%          | 75%            | 75%         |
| 12   | 71%          | 71%            | 70%         |
| 15   | 67%          | 66%            | 65%         |
| 20   | 60%          | 59%            | 60%         |

## PB系统实现逻辑

### 算法流程

```typescript
// 1. 计算等效1RM
function calculateEstimated1RM(weight: number, reps: number): number {
  // 使用Epley公式
  if (reps === 1) return weight;
  return weight * (1 + 0.0333 * reps);
}

// 2. 更新PB逻辑
function updatePB(
  exercise: string,
  weight: number,
  reps: number,
  setNumber: number
) {
  const estimated1RM = calculateEstimated1RM(weight, reps);
  const currentPB = getExercisePB(exercise);

  // 首次记录
  if (!currentPB) {
    setExercisePB(exercise, estimated1RM);
    showMessage(`${estimated1RM.toFixed(1)} is your starting PB for ${exercise}`);
    return;
  }

  // PB突破
  if (estimated1RM > currentPB) {
    const improvement = estimated1RM - currentPB;
    setExercisePB(exercise, estimated1RM);
    showCongratulation(
      `You just beat your personal best in '${exercise}' by ${improvement.toFixed(1)}!
       ${estimated1RM.toFixed(1)} is your new pb.`
    );
  }
}

// 3. 训练建议生成
function generateTrainingRecommendation(pb1RM: number, targetReps: number) {
  const percentage = getPercentageForReps(targetReps);
  return pb1RM * percentage;
}

// 4. 百分比查询
function getPercentageForReps(reps: number): number {
  const repPercentageMap = {
    1: 1.00,
    2: 0.95,
    3: 0.90,
    5: 0.86,
    8: 0.79,
    10: 0.75,
    12: 0.71,
    15: 0.67,
  };
  return repPercentageMap[reps] || (1.0278 - 0.0278 * reps);
}
```

### 数据结构设计

```typescript
interface ExercisePB {
  exerciseName: string;
  pb1RM: number;              // 个人最佳等效1RM
  achievedWeight: number;     // 达成时的实际重量
  achievedReps: number;       // 达成时的次数
  achievedDate: Date;         // 达成日期
  previousPB?: number;        // 前一次PB
}

interface WorkoutSet {
  setNumber: number;
  targetWeight: number;
  targetReps: string;         // "8+ reps", "max reps"
  actualWeight?: number;
  actualReps?: number;
  estimated1RM?: number;      // 计算出的等效1RM
}

interface PerformanceHistory {
  exercise: string;
  date: Date;
  day: number;
  setNumber: number;
  weight: number;
  reps: number;
  estimated1RM: number;
}
```

## 准确性与最佳实践

### 准确性因素

1. **次数范围影响**：
   - ✅ **1-10次**：估算最准确（误差±5%）
   - ⚠️ **10-15次**：准确度下降（误差±10%）
   - ❌ **15次以上**：误差较大（>±15%）

2. **运动类型影响**：
   - **复合动作**（深蹲、硬拉、卧推）：公式较准确
   - **孤立动作**（二头弯举、飞鸟）：可能偏差较大
   - **爆发力动作**（抓举、挺举）：不适用这些公式

3. **个体差异**：
   - 训练水平（新手 vs 高级）
   - 肌肉类型（快肌 vs 慢肌比例）
   - 疲劳状态
   - 技术熟练度

### 实施建议

#### 对于开发者：

1. **公式选择**：
   ```typescript
   // 推荐使用Epley公式作为主公式
   // 可选添加Brzycki作为交叉验证
   const epley1RM = weight * (1 + 0.0333 * reps);
   const brzycki1RM = weight / (1.0278 - 0.0278 * reps);

   // 保守估算：取较小值
   const estimated1RM = Math.min(epley1RM, brzycki1RM);
   ```

2. **次数限制**：
   ```typescript
   // 只在1-12次范围内计算1RM
   if (reps < 1 || reps > 12) {
     console.warn("次数超出推荐范围，估算可能不准确");
   }
   ```

3. **PB更新策略**：
   ```typescript
   // 设置最小提升阈值，避免微小波动
   const MIN_IMPROVEMENT = 0.5; // kg
   if (estimated1RM - currentPB >= MIN_IMPROVEMENT) {
     updatePB(estimated1RM);
   }
   ```

4. **历史数据验证**：
   ```typescript
   // 检测异常数据
   if (estimated1RM > currentPB * 1.15) {
     flagForReview("可能的异常提升，请确认数据");
   }
   ```

#### 对于用户：

1. **测试建议**：
   - 使用3-5RM测试最准确
   - 充分热身后进行
   - 保持良好的动作质量

2. **PB追踪**：
   - 定期（每4-6周）进行PB测试
   - 记录多个次数范围的数据
   - 关注长期趋势而非单次波动

3. **训练应用**：
   - 基于PB的70-85%进行训练
   - 保留2-3次的储备次数（RIR）
   - 渐进式超负荷原则

## 应用特色功能

### 1. 智能训练推荐

基于当前PB自动计算训练重量：
```
如果PB = 100kg
- 力量训练（3-5次）：90-95kg（90-95% 1RM）
- 肌肥大训练（8-12次）：70-80kg（70-80% 1RM）
- 肌耐力训练（15+次）：60-70kg（60-70% 1RM）
```

### 2. 首次设定引导

- 引导用户选择"适度重量"
- 要求做到力竭以准确建立基准
- 清晰说明该数据将影响后续训练建议

### 3. 进步可视化

- 实时显示等效1RM
- 突出显示PB突破
- 记录提升幅度

### 4. 多维度追踪

- **绝对重量**：实际举起的重量
- **等效1RM**：标准化的力量指标
- **相对强度**：重量占PB的百分比
- **训练容量**：组数 × 次数 × 重量

## 技术实现要点

### 前端展示

```typescript
// 实时1RM计算显示
function formatSetDisplay(weight: number, reps: number) {
  const estimated1RM = calculateEstimated1RM(weight, reps);
  return `${weight} kg × ${reps} reps = ${estimated1RM.toFixed(1)} max kg`;
}

// PB状态指示
function getPBIndicator(currentEstimate: number, pb: number) {
  if (!pb) return "NEW";
  if (currentEstimate > pb) return "PB! 🎉";
  const percentage = (currentEstimate / pb * 100).toFixed(1);
  return `${percentage}% of PB`;
}
```

### 后端存储

```sql
-- 运动PB表
CREATE TABLE exercise_pbs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  exercise_name VARCHAR(100) NOT NULL,
  pb_1rm DECIMAL(5,2) NOT NULL,
  achieved_weight DECIMAL(5,2) NOT NULL,
  achieved_reps INT NOT NULL,
  achieved_date TIMESTAMP NOT NULL,
  previous_pb DECIMAL(5,2),
  UNIQUE(user_id, exercise_name)
);

-- 训练历史表
CREATE TABLE performance_history (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  exercise_name VARCHAR(100) NOT NULL,
  workout_date DATE NOT NULL,
  day_number INT,
  set_number INT,
  weight DECIMAL(5,2) NOT NULL,
  reps INT NOT NULL,
  estimated_1rm DECIMAL(5,2) NOT NULL,
  is_pb BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX idx_pbs_user ON exercise_pbs(user_id);
CREATE INDEX idx_history_user_exercise ON performance_history(user_id, exercise_name);
CREATE INDEX idx_history_date ON performance_history(workout_date DESC);
```

### API设计

```typescript
// POST /api/workouts/sets
interface RecordSetRequest {
  exerciseName: string;
  weight: number;
  reps: number;
  setNumber: number;
  dayNumber: number;
}

interface RecordSetResponse {
  estimated1RM: number;
  isPB: boolean;
  pbInfo?: {
    newPB: number;
    previousPB: number;
    improvement: number;
  };
  percentageOfPB: number;
}

// GET /api/exercises/{exerciseName}/pb
interface PBResponse {
  exerciseName: string;
  currentPB: number;
  achievedDate: string;
  achievedWith: {
    weight: number;
    reps: number;
  };
  history: Array<{
    pb: number;
    date: string;
  }>;
}
```

## 总结

Recomposer应用通过以下核心机制实现有效的PB追踪：

1. **标准化指标**：使用等效1RM统一衡量不同重量和次数组合的力量表现
2. **实时反馈**：每组训练后立即显示等效1RM和PB对比
3. **智能激励**：PB突破时给予即时的正向反馈
4. **数据驱动**：基于PB自动生成训练建议

**推荐公式组合**：
- 主公式：Epley（简单、准确）
- 备用公式：Brzycki（交叉验证）
- 适用范围：1-10次重复
- 保守策略：取较小值作为估算结果

这种系统能够有效帮助用户：
- 客观追踪力量进步
- 科学制定训练计划
- 保持训练动力
- 避免过度训练或训练不足
