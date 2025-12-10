"""
直接测试 Coze API 认证
"""
import httpx

token = 'pat_kHM3rm8CbTqUuDk5JoSGVErqFGkiP0Q5uq2qW0qpr4zVER79upO0lLgLNIdiTlGN'
base_url = 'https://api.coze.cn'

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# 测试获取 workspace 列表来验证 token 是否有效
response = httpx.get(f'{base_url}/v1/workspaces', headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
