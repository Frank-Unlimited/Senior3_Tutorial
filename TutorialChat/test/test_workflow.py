"""
This example describes how to use the workflow interface to stream chat.
"""
import os
from cozepy import COZE_CN_BASE_URL
from cozepy import Coze, TokenAuth, Stream, WorkflowEvent, WorkflowEventType

# Get an access_token through Service Access Token (SAT).
coze_api_token = 'sat_2culNIjUZUWBrHfB1qCSNBtoG1b73h7wwHHHf0bW9BlDvDFRdTh972MdhQQK4Dqi'

# The default access is api.coze.com, but if you need to access api.coze.cn,
# please use base_url to configure the api endpoint to access
coze_api_base = COZE_CN_BASE_URL

# Init the Coze client through the access_token.
coze = Coze(auth=TokenAuth(token=coze_api_token), base_url=coze_api_base)

# Create a workflow instance in Coze, copy the last number from the web link as the workflow's ID.
workflow_id = '7582071103931170822'


def handle_workflow_iterator(stream: Stream[WorkflowEvent]):
    """
    The stream interface will return an iterator of WorkflowEvent. Developers should iterate
    through this iterator to obtain WorkflowEvent and handle them separately according to
    the type of WorkflowEvent.
    """
    results = []
    for event in stream:
        if event.event == WorkflowEventType.MESSAGE:
            print("got message:", event.message)
            results.append({"type": "message", "data": event.message})
        elif event.event == WorkflowEventType.ERROR:
            print("got error:", event.error)
            results.append({"type": "error", "data": event.error})
        elif event.event == WorkflowEventType.INTERRUPT:
            print("got interrupt, resuming...")
            results.append({"type": "interrupt", "data": event.interrupt})
            handle_workflow_iterator(
                coze.workflows.runs.resume(
                    workflow_id=workflow_id,
                    event_id=event.interrupt.interrupt_data.event_id,
                    resume_data="hey",
                    interrupt_type=event.interrupt.interrupt_data.type,
                )
            )
    return results


if __name__ == "__main__":
    print("=" * 50)
    print("Starting Coze Workflow Stream Test")
    print("=" * 50)
    print(f"Workflow ID: {workflow_id}")
    print(f"API Base: {coze_api_base}")
    print("=" * 50)
    
    try:
        # Workflow 需要 question_img 参数
        # 使用国内可访问的测试图片
        params = {
            "question_img": "https://test-1310310414.cos.ap-nanjing.myqcloud.com/test_question.png?q-sign-algorithm=sha1&q-ak=AKIDAJpKXtMrcw4BJBjqVbap6LYouxjXYaoQqZwXH35fgl0YuD7UCW7JG_FeI8-yXGbX&q-sign-time=1765343765;1765347365&q-key-time=1765343765;1765347365&q-header-list=host&q-url-param-list=&q-signature=b571e63268f154ce0734878ba7b16c145b8c4ed6&x-cos-security-token=3ZFq2Uvy4zGgvHSXEwpX1bJwgwRBpoyab3ecf6194c5055296bea2795176b4d19qbSb1tkYTKFCRO4k7Lu2sZ5w-UVRBGOuGNQ4tk19qIn-eOT71xUBQKzrLdWm3gSXg3KoczuGdQsJL0ceLpInAjFechyY1TFLzzckMzFRIk74XoU7V4eOx_cfUbqp8FdQW2piLV1QkbaTPqAkDIezoWP_AFpfQnowFDgQORelVw66Jp7kr793DDNvBG7Orfvve5EWNNgcez9NiFZF2AIy-Ga69w4JJ7MEcAXsqUzkOhNEiAmvoNxszxgbPCkIfVils1K76d0WAfoU2sglYZsIbw"
        }
        
        results = handle_workflow_iterator(
            coze.workflows.runs.stream(
                workflow_id=workflow_id,
                parameters=params,
            )
        )
        print("\n" + "=" * 50)
        print("Test completed successfully!")
        print(f"Total events received: {len(results)}")
    except Exception as e:
        print(f"\nError occurred: {type(e).__name__}: {e}")
