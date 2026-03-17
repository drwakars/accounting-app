#!/bin/bash

# تصدير Token
export EXPO_TOKEN="FOTroBK8hxcxvRLLhFx8mK7myxxoaukYYGdL8_-I"
export EAS_BUILD_NO_EXPO_GO_WARNING=true

cd /app/frontend

echo "🚀 جاري بناء IPA..."
echo "⏰ هذا سيستغرق 15-20 دقيقة تقريباً"
echo ""

# البناء
eas build --platform ios --profile production --auto-submit=false

echo ""
echo "✅ اكتمل البناء!"
echo "📥 تقدر تحمل IPA من الرابط اللي طلع فوق"
