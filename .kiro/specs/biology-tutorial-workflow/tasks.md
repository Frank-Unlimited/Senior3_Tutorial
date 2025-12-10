# Implementation Plan

## Biology Tutorial Workflow - LangChain 后端服务

- [x] 1. 项目初始化与配置管理




  - [x] 1.1 创建项目目录结构和依赖配置

    - 创建 `TutorialChat_backend/` 目录
    - 创建 `pyproject.toml` 或 `requirements.txt`，包含 FastAPI, LangChain, Hypothesis, pytest 等依赖
    - 创建基础目录结构: `config/`, `session/`, `workflow/`, `sse/`, `api/`, `models/`, `tests/`
    - _Requirements: 10.1_

  - [x] 1.2 实现配置加载模块


    - 创建 `config/settings.py`，实现 Settings, ModelConfig, VisionModelConfig 类
    - 实现 `from_yaml()` 方法加载 settings.yaml
    - 实现环境变量替换 (${VAR_NAME} 语法)
    - 实现默认值处理逻辑
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.3 编写配置模块属性测试
    - **Property 1: Configuration Round-Trip Consistency**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 1.4 编写配置模块属性测试
    - **Property 2: Default Value Application**
    - **Validates: Requirements 1.3**

  - [ ]* 1.5 编写配置模块属性测试
    - **Property 3: Malformed Configuration Rejection**
    - **Validates: Requirements 1.4**


  - [x] 1.6 创建示例 settings.yaml 配置文件

    - 创建 `settings.yaml` 模板，包含豆包模型默认配置
    - 创建 `settings.example.yaml` 供用户参考
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. 会话管理模块


  - [x] 2.1 实现会话数据模型

    - 创建 `session/models.py`，实现 TaskStatus, TutoringStyle 枚举
    - 实现 TaskState, Session 数据类
    - _Requirements: 3.2, 3.4_


  - [x] 2.2 实现会话管理器

    - 创建 `session/manager.py`，实现 SessionManager 类
    - 实现 `create_session()`, `get_session()`, `update_session()` 方法
    - 实现 `update_task_status()` 方法
    - 支持内存存储和可选 Redis 存储
    - _Requirements: 2.1, 3.2, 3.4_

  - [ ]* 2.3 编写会话管理属性测试
    - **Property 4: Session Creation Idempotence**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.4 编写会话状态持久化属性测试
    - **Property 7: Session State Persistence**
    - **Validates: Requirements 3.2, 3.4**

- [x] 3. SSE 发布模块


  - [x] 3.1 实现 SSE 发布器

    - 创建 `sse/publisher.py`，实现 SSEPublisher 类
    - 实现 `subscribe()`, `unsubscribe()`, `publish()` 方法
    - 实现断线期间事件存储和重连恢复
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 3.2 编写 SSE 重连恢复属性测试
    - **Property 12: SSE Reconnection Recovery**
    - **Validates: Requirements 7.3, 7.4**

- [ ] 4. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 模型工厂与 LangChain 集成


  - [x] 5.1 实现模型工厂

    - 创建 `workflow/model_factory.py`
    - 实现 `ModelFactory.create()` 方法，支持 doubao, openai, zhipu 等提供商
    - 集成 LangChain 的 ChatModel 接口
    - _Requirements: 1.2, 10.1_

  - [x] 5.2 实现视觉理解 Chain


    - 创建 `workflow/chains/vision_chain.py`
    - 实现图片 base64 编码和多模态输入
    - 实现题干提取 prompt（不解答，只提取）
    - _Requirements: 2.2, 2.5_

  - [ ]* 5.3 编写视觉提取通知属性测试
    - **Property 5: Vision Extraction Notification**
    - **Validates: Requirements 2.3, 2.5**

  - [x] 5.4 实现深度解答 Chain


    - 创建 `workflow/chains/solution_chain.py`
    - 实现深度思考 prompt，启用详细推理
    - 支持引导式和直接解答两种输出格式
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ]* 5.5 编写辅导风格格式化属性测试
    - **Property 13: Tutoring Style Formatting**
    - **Validates: Requirements 4.4**

  - [x] 5.6 实现快速考察点 Chain


    - 创建 `workflow/chains/exam_points_chain.py`
    - 实现考察点总结 prompt（不推理，不解答）
    - _Requirements: 5.1, 5.3_

  - [ ]* 5.7 编写考察点内容验证属性测试
    - **Property 14: Exam Points Content Validation**
    - **Validates: Requirements 5.3**


  - [x] 5.8 实现知识点和逻辑链 Chain

    - 创建 `workflow/chains/knowledge_chain.py`
    - 创建 `workflow/chains/logic_chain.py`
    - 实现知识点和易错点提取 prompt
    - 实现解题逻辑链梳理 prompt
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 6. Workflow 编排

  - [x] 6.1 实现主 Workflow 类

    - 创建 `workflow/biology_tutor.py`
    - 实现 BiologyTutorWorkflow 类
    - 使用 LangChain LCEL 组合各 Chain
    - _Requirements: 10.1, 10.2_

  - [x] 6.2 实现异步任务调度

    - 实现 `process_image()` 方法，启动后台视觉理解
    - 实现 `_run_vision_extraction()` 异步方法
    - 实现任务完成后的 SSE 通知
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 6.3 编写任务失败通知属性测试
    - **Property 6: Task Failure Notification**
    - **Validates: Requirements 2.4**


  - [x] 6.4 实现并行分析任务


    - 使用 RunnableParallel 实现考察点和深度解答并行
    - 实现 `_start_parallel_analysis()` 方法
    - _Requirements: 4.1, 5.1, 10.2_

  - [ ]* 6.5 编写任务链式触发属性测试
    - **Property 8: Task Chaining - Vision to Analysis**
    - **Validates: Requirements 4.1, 5.1**




  - [x] 6.6 实现后续并行任务
    - 实现解答完成后的知识点和逻辑链并行提取
    - 实现会话完成状态标记
    - _Requirements: 6.1, 6.4_

  - [ ]* 6.7 编写解答到知识点任务链属性测试
    - **Property 9: Task Chaining - Solution to Knowledge**
    - **Validates: Requirements 6.1**

  - [ ]* 6.8 编写 SSE 事件完整性属性测试
    - **Property 10: SSE Event Completeness**
    - **Validates: Requirements 4.2, 5.2, 6.2, 6.3**

  - [ ]* 6.9 编写会话完成状态属性测试
    - **Property 11: Session Completion State**
    - **Validates: Requirements 6.4**

  - [ ]* 6.10 编写并行执行验证属性测试
    - **Property 16: Parallel Execution Verification**
    - **Validates: Requirements 10.2**

- [ ] 7. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. API 路由实现
  - [x] 8.1 实现 FastAPI 应用入口


    - 创建 `main.py`，初始化 FastAPI 应用
    - 配置 CORS 中间件
    - 加载 settings.yaml 配置
    - 初始化全局依赖（SessionManager, SSEPublisher, Workflow）
    - _Requirements: 1.1_





  - [x] 8.2 实现会话创建 API
    - 创建 `api/routes.py`
    - 实现 `POST /api/session` 端点
    - 生成温柔大姐姐风格问候语
    - _Requirements: 8.1, 3.1, 9.1_

  - [x] 8.3 实现图片上传 API
    - 实现 `POST /api/session/{id}/image` 端点
    - 接收图片文件并启动后台处理
    - _Requirements: 8.2, 2.1, 2.2_

  - [x] 8.4 实现消息处理 API
    - 实现 `POST /api/session/{id}/message` 端点
    - 处理用户思考过程、疑惑、辅导方式选择
    - 实现对话状态机逻辑
    - _Requirements: 8.3, 3.2, 3.3, 3.4_

  - [x] 8.5 实现 SSE 事件订阅 API
    - 实现 `GET /api/session/{id}/events` 端点
    - 返回 StreamingResponse 用于 SSE
    - _Requirements: 8.4, 7.1_


  - [x] 8.6 实现状态查询 API
    - 实现 `GET /api/session/{id}/status` 端点
    - 返回所有任务状态
    - _Requirements: 8.5_

  - [ ]* 8.7 编写 API 状态响应完整性属性测试
    - **Property 15: API Status Response Completeness**

    - **Validates: Requirements 8.5**

- [x] 9. 人设与 Prompt 模板

  - [x] 9.1 创建 Prompt 模板文件

    - 创建 `prompts/` 目录
    - 创建 `persona.txt` - 温柔大姐姐人设
    - 创建 `vision_extraction.txt` - 题干提取 prompt
    - 创建 `solution_guided.txt` - 引导式解答 prompt
    - 创建 `solution_direct.txt` - 直接解答 prompt
    - 创建 `exam_points.txt` - 考察点总结 prompt
    - 创建 `knowledge_points.txt` - 知识点梳理 prompt
    - 创建 `logic_chain.txt` - 逻辑链梳理 prompt
    - _Requirements: 9.1, 9.2, 9.3_


- [x] 10. 错误处理与重试机制

  - [x] 10.1 实现错误处理模块

    - 创建 `utils/errors.py`
    - 定义错误码和错误响应模型
    - 实现全局异常处理器
    - _Requirements: 1.4, 2.4, 10.4_


  - [x] 10.2 实现重试机制

    - 使用 tenacity 库实现模型调用重试
    - 配置指数退避策略
    - _Requirements: 10.4_

  - [ ]* 10.3 编写错误传播处理属性测试
    - **Property 17: Error Propagation Graceful Handling**
    - **Validates: Requirements 10.4**

- [ ] 11. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
