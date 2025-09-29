# Body Test 计算公式与算法文档

基于对 body test 应用的分析，本文档整理了实现健身身体测试功能所需的核心计算公式和算法。

## 目录
- [身体成分分析](#身体成分分析)
- [皮褶厚度测量法](#皮褶厚度测量法)
- [力量预测算法](#力量预测算法)
- [代谢计算](#代谢计算)
- [目标设定与追踪](#目标设定与追踪)
- [实现建议](#实现建议)

## 身体成分分析

### 1. 体脂率计算

#### 生物电阻抗分析 (BIA) 公式
```javascript
// 基础体脂率计算
const bodyFatPercentage = (fatMass / totalWeight) * 100;

// 体脂重量计算
const fatMass = totalWeight - leanBodyMass;

// BIA预测公式（示例 - 需根据设备校准）
const bodyFatBIA = a + (b * resistance) + (c * reactance) + (d * height²/weight) + (e * age) + (f * gender);
```

#### DEXA扫描算法
```javascript
// DEXA精确体脂计算
const bodyFatDEXA = (fatTissueMass / totalMass) * 100;
```

### 2. 瘦体重和肌肉量

```javascript
// 瘦体重计算
const leanBodyMass = totalWeight - fatMass;

// 肌肉量计算
const muscleMass = leanBodyMass - boneMass - organMass - waterMass;

// 肌肉百分比
const musclePercentage = (muscleMass / totalWeight) * 100;
```

### 3. 身体水分计算

```javascript
// 总体水分
const totalBodyWater = leanBodyMass * 0.73;

// 细胞内水分
const intracellularWater = totalBodyWater * 0.67;

// 细胞外水分
const extracellularWater = totalBodyWater * 0.33;
```

## 皮褶厚度测量法

### 1. 3-Site 方案

#### 男性公式（胸部、腹部、大腿）
```javascript
function calculate3SiteMale(chest, abdomen, thigh, age) {
    const sum = chest + abdomen + thigh;
    const bodyDensity = 1.10938 - 0.0008267 * sum + 0.0000016 * (sum * sum) - 0.0002574 * age;
    return siriFormula(bodyDensity);
}
```

#### 女性公式（三头肌、髂上、大腿）
```javascript
function calculate3SiteFemale(triceps, suprailiac, thigh, age) {
    const sum = triceps + suprailiac + thigh;
    const bodyDensity = 1.0994921 - 0.0009929 * sum + 0.0000023 * (sum * sum) - 0.0001392 * age;
    return siriFormula(bodyDensity);
}
```

### 2. 7-Site 方案（Jackson-Pollock）

#### 测量部位
- 胸部 (Chest)
- 腋中 (Midaxillary)
- 三头肌 (Triceps)
- 肩胛下 (Subscapular)
- 腹部 (Abdominal)
- 髂上 (Suprailiac)
- 大腿 (Thigh)

```javascript
function calculate7SiteMale(measurements, age) {
    const sum = measurements.reduce((a, b) => a + b, 0);
    const bodyDensity = 1.112 - 0.00043499 * sum + 0.00000055 * (sum * sum) - 0.00028826 * age;
    return siriFormula(bodyDensity);
}

function calculate7SiteFemale(measurements, age) {
    const sum = measurements.reduce((a, b) => a + b, 0);
    const bodyDensity = 1.097 - 0.00046971 * sum + 0.00000056 * (sum * sum) - 0.00012828 * age;
    return siriFormula(bodyDensity);
}
```

### 3. 9-Site 方案

#### 测量部位
- 胸部、腋中、三头肌、肩胛下、腹部、髂上、大腿、小腿、二头肌

```javascript
// Parillo 9点公式
function calculateParillo9Site(measurements) {
    const sum = measurements.reduce((a, b) => a + b, 0);
    return (sum * 0.11) + skinfoldConstant;
}

// Durnin-Womersley 9点公式
function calculateDurnin9Site(measurements, age, gender) {
    const sum = measurements.reduce((a, b) => a + b, 0);
    const { C, M } = getDurninConstants(age, gender);
    const bodyDensity = C - M * Math.log10(sum);
    return siriFormula(bodyDensity);
}
```

### 4. 体密度转换公式

```javascript
// Siri公式
function siriFormula(bodyDensity) {
    return (495 / bodyDensity) - 450;
}

// Brozek公式
function brozekFormula(bodyDensity) {
    return (457 / bodyDensity) - 414.2;
}
```

## 力量预测算法

### 1. 1RM预测公式

#### Epley公式
```javascript
function epleyFormula(weight, reps) {
    return weight * (1 + reps / 30);
}
```

#### Brzycki公式
```javascript
function brzyckiFormula(weight, reps) {
    return weight * (36 / (37 - reps));
}
```

#### O'Conner公式
```javascript
function oconnerFormula(weight, reps) {
    return weight * (1 + 0.025 * reps);
}
```

### 2. 基于身体成分的力量预测

```javascript
// 卧推预测
function predictBenchPress(leanBodyMass, trainingLevel = 'intermediate') {
    const multipliers = {
        beginner: 1.2,
        intermediate: 1.6,
        advanced: 2.0,
        elite: 2.2
    };
    return leanBodyMass * multipliers[trainingLevel];
}

// 深蹲预测
function predictSquat(leanBodyMass, trainingLevel = 'intermediate') {
    const multipliers = {
        beginner: 1.8,
        intermediate: 2.2,
        advanced: 2.8,
        elite: 3.2
    };
    return leanBodyMass * multipliers[trainingLevel];
}

// 硬拉预测
function predictDeadlift(leanBodyMass, trainingLevel = 'intermediate') {
    const multipliers = {
        beginner: 2.0,
        intermediate: 2.5,
        advanced: 3.0,
        elite: 3.5
    };
    return leanBodyMass * multipliers[trainingLevel];
}
```

## 代谢计算

### 1. 基础代谢率 (BMR)

#### Mifflin-St Jeor公式
```javascript
function calculateBMRMifflin(weight, height, age, gender) {
    const base = (10 * weight) + (6.25 * height) - (5 * age);
    return gender === 'male' ? base + 5 : base - 161;
}
```

#### Harris-Benedict公式
```javascript
function calculateBMRHarris(weight, height, age, gender) {
    if (gender === 'male') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
}
```

#### Katch-McArdle公式（基于瘦体重）
```javascript
function calculateBMRKatch(leanBodyMass) {
    return 370 + (21.6 * leanBodyMass);
}
```

### 2. 总日常能量消耗 (TDEE)

```javascript
function calculateTDEE(bmr, activityLevel) {
    const activityMultipliers = {
        sedentary: 1.2,        // 久坐
        lightlyActive: 1.375,  // 轻度活动
        moderatelyActive: 1.55, // 中度活动
        veryActive: 1.725,     // 高度活动
        extraActive: 1.9       // 极度活动
    };
    return bmr * activityMultipliers[activityLevel];
}
```

## 目标设定与追踪

### 1. 减重目标计算

```javascript
function calculateWeightLossTarget(currentWeight, currentBodyFat, targetBodyFat) {
    const currentFatMass = currentWeight * (currentBodyFat / 100);
    const currentLeanMass = currentWeight - currentFatMass;

    // 假设瘦体重保持不变
    const targetWeight = currentLeanMass / (1 - targetBodyFat / 100);
    const weightToLose = currentWeight - targetWeight;
    const fatToLose = currentFatMass - (targetWeight * targetBodyFat / 100);

    return {
        targetWeight,
        weightToLose,
        fatToLose
    };
}
```

### 2. 进度追踪算法

```javascript
function calculateProgress(initial, current, target) {
    const totalChange = target - initial;
    const currentChange = current - initial;
    const progressPercentage = (currentChange / totalChange) * 100;

    return {
        progressPercentage: Math.min(Math.max(progressPercentage, 0), 100),
        remainingChange: target - current,
        changeRate: currentChange // 可用于计算变化速率
    };
}
```

### 3. 体重变化预测

```javascript
function predictWeightChange(calorieDeficit, timeframe) {
    // 1磅脂肪 ≈ 3500卡路里
    const caloriesPerPound = 3500;
    const caloriesPerKg = caloriesPerPound * 2.20462;

    const totalCalorieDeficit = calorieDeficit * timeframe;
    const expectedWeightLoss = totalCalorieDeficit / caloriesPerKg;

    return expectedWeightLoss;
}
```

## 测量点位详细说明

### 皮褶厚度测量位置

```javascript
const skinfoldSites = {
    chest: "胸大肌和前锯肌之间，腋前线水平",
    abdominal: "脐旁2cm处，垂直皮褶",
    thigh: "大腿前侧中点，垂直皮褶",
    triceps: "上臂后侧中点，垂直皮褶",
    subscapular: "肩胛骨下角下方，45度角皮褶",
    suprailiac: "髂前上棘上方，斜向皮褶",
    midaxillary: "腋中线与胸骨柄水平线交点",
    calf: "小腿最大围度处内侧，垂直皮褶",
    biceps: "上臂前侧中点，垂直皮褶"
};
```

## 实现建议

### 1. 数据验证

```javascript
function validateMeasurement(value, type) {
    const ranges = {
        skinfold: { min: 2, max: 50 }, // mm
        weight: { min: 30, max: 300 }, // kg
        height: { min: 120, max: 250 }, // cm
        age: { min: 10, max: 100 }
    };

    const range = ranges[type];
    return value >= range.min && value <= range.max;
}
```

### 2. 精度考虑

```javascript
const accuracyLevels = {
    skinfold3Site: { error: "±3-5%", reliability: "Good" },
    skinfold7Site: { error: "±2-3%", reliability: "Very Good" },
    skinfold9Site: { error: "±1-2%", reliability: "Excellent" },
    BIA: { error: "±3-8%", reliability: "Good" },
    DEXA: { error: "±1-2%", reliability: "Gold Standard" }
};
```

### 3. 实现优先级

1. **第一优先级**：基础BMR/TDEE计算，简单的体脂率计算
2. **第二优先级**：3-site和7-site皮褶测量法
3. **第三优先级**：力量预测算法，9-site测量法
4. **第四优先级**：高级分析功能，趋势预测

### 4. 用户界面考虑

```javascript
const uiRecommendations = {
    inputValidation: "实时验证输入数据范围",
    visualization: "使用进度条和图表展示结果",
    comparison: "提供当前vs目标的对比视图",
    history: "显示历史趋势和变化",
    guidance: "提供测量指导和结果解释"
};
```

## 参考资料

- Jackson, A.S. & Pollock, M.L. (1978). Generalized equations for predicting body density of men.
- Durnin, J.V.G.A. & Womersley, J. (1974). Body fat assessed from total body density.
- Siri, W.E. (1961). Body composition from fluid spaces and density.
- Epley, B. (1985). Poundage Chart. Boyd Epley Workout.
- Mifflin, M.D. et al. (1990). A new predictive equation for resting energy expenditure.

---

*本文档为 gym-buddy 项目的技术参考资料，包含实现身体测试功能所需的核心算法。建议在实现时参考最新的运动科学研究成果进行校准和优化。*