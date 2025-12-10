#!/bin/sh
set -e

# 运行时环境变量注入
# 将环境变量写入 config.js，前端可以读取

CONFIG_FILE="/usr/share/nginx/html/config.js"

cat > $CONFIG_FILE << EOF
window.__RUNTIME_CONFIG__ = {
  BACKEND_URL: "${BACKEND_URL:-http://localhost:8000}",
  API_KEY: "${API_KEY:-}"
};
EOF

echo "Runtime config generated:"
cat $CONFIG_FILE

# 执行传入的命令
exec "$@"
