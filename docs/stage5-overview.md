## 阶段 5 · 教师 / 管理工具（规划）

### 核心目标

- 为教师提供班级管理、作业布置、学生监控和报表导出能力。
- 与阶段 4 的数据同步管线协同，实现多角色权限与共享数据视图。
- 预备与第三方（Google Classroom / Microsoft Teams / Clever）集成，方便导入学生名单。

### 计划交付

1. **课堂管理功能**
   - 班级列表、学生 roster、tag / accommodation（适配）设置。
   - 从 CSV / Google Classroom / Microsoft Teams 导入学生数据。
   - 家长账号、邀请链接、入班请求审批。

2. **作业与课程安排**
   - 创建作业（选择 Lesson / Track / 自定义文本），指定 due date 与时间限制。
   - 分发给全班或特定小组/学生，支持循环任务。
   - 锁定/解锁内容、设置 prerequisite 链路。

3. **数据视图 & 报表**
   - 班级概览：平均 WPM / Accuracy、完成率、星级分布。
   - 学生详情：按课件的表现、错误热力、连胜记录。
   - 导出 PDF / CSV / Excel，支持定期邮件推送。

4. **权限模型**
   - 角色：student / teacher / admin / parent。
   - 教师可管理所属班级；管理员可创建组织和模板。
   - 家长只读子女数据，无法修改。

5. **文档 & 测式**
   - `stage5-classroom.md`（课堂管理设计）
   - `stage5-reporting.md`（报表与导出设计）
   - QA：课堂流程、作业布置、数据权限单元测试与 End-to-end 测试。

### 阶段节点

- **5-1** 当前规划
- **5-2** 设计 classroom + assignment 方案
- **5-3** 实现基础教师端 UI、配合后端 API & 报表导出

阶段 5 完成后，平台进入教学应用场景，为阶段 6（智能推荐 / 全球部署）打基础。

