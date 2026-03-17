# 🚀 دليل بناء IPA خطوة بخطوة

## 📥 الخطوة 1: حمّل المشروع

**حمّل الملف:** `accounting-ledger-app.tar.gz`

**فك الضغط:**

### على Windows:
- استخدم WinRAR أو 7-Zip
- أو حمّل: https://www.7-zip.org
- Right click على الملف → Extract Here

### على Mac/Linux:
```bash
tar -xzf accounting-ledger-app.tar.gz
```

---

## 💻 الخطوة 2: ثبّت البرامج المطلوبة

### أ) Node.js (ضروري)
1. روح: https://nodejs.org
2. حمّل النسخة LTS (الموصى بها)
3. ثبّته (Next, Next, Install)
4. تحقق من التثبيت:
```bash
node --version
npm --version
```

### ب) Yarn (ضروري)
```bash
npm install -g yarn
```

### ج) EAS CLI (ضروري)
```bash
npm install -g eas-cli
```

---

## 📂 الخطوة 3: افتح Terminal وروح لمجلد المشروع

### على Windows:
1. افتح Command Prompt أو PowerShell:
   - اضغط `Win + R`
   - اكتب `cmd` واضغط Enter

2. روح لمجلد المشروع:
```bash
cd C:\Downloads\accounting-ledger-app\frontend
```
(غيّر المسار حسب مكان الملف عندك)

### على Mac:
1. افتح Terminal:
   - اضغط `Cmd + Space`
   - اكتب `Terminal` واضغط Enter

2. روح لمجلد المشروع:
```bash
cd ~/Downloads/accounting-ledger-app/frontend
```

---

## 📦 الخطوة 4: ثبّت المكتبات

في Terminal، شغّل:

```bash
yarn install
```

⏰ **راح ياخذ 2-5 دقائق** (يحمّل كل المكتبات)

انتظر لين يطلع:
```
✨ Done in X.XXs
```

---

## 🔐 الخطوة 5: سجل دخول Expo

في نفس Terminal:

```bash
eas login
```

**رح يطلب منك:**
- **Email or username:** أدخل إيميلك (supper.booyy@gmail.com)
- **Password:** أدخل باسوردك

**لما تشوف:**
```
Logged in as amardjxy
```
معناه نجح! ✅

---

## 🏗️ الخطوة 6: ابني IPA

الحين شغّل هذا الأمر:

```bash
eas build --platform ios --profile production
```

---

## ❓ رح يسألك أسئلة - هذي الأجوبة:

### السؤال 1:
```
Would you like to automatically create an EAS project for @amardjxy/accounting-ledger?
```
**الجواب:** اكتب `Y` واضغط Enter

---

### السؤال 2:
```
What would you like your iOS bundle identifier to be?
```
**الجواب:** اترك الافتراضي `com.amardjxy.accountingledger` واضغط Enter
(أو غيّره لـ: `com.yourname.accountingledger`)

---

### السؤال 3:
```
Generate a new Apple Distribution Certificate?
```
**الجواب:** اكتب `Y` واضغط Enter

---

### السؤال 4:
```
Generate a new Apple Provisioning Profile?
```
**الجواب:** اكتب `Y` واضغط Enter

---

## ⏰ الخطوة 7: انتظر البناء

بعد الأجوبة، رح يبدأ البناء:

```
✔ Build started, it may take a few minutes to complete.

Build details:
https://expo.dev/accounts/amardjxy/projects/accounting-ledger/builds/xxxxx
```

**المدة:** 15-25 دقيقة تقريباً

**تقدر:**
- ✅ تتابع التقدم من الرابط
- ✅ تسكر Terminal (البناء مستمر على خوادم Expo)
- ✅ تشرب قهوة ☕

---

## 📥 الخطوة 8: حمّل IPA

بعد ما ينتهي البناء، رح تشوف:

```
✔ Build finished

https://expo.dev/artifacts/eas/xxxxx.ipa
```

**اضغط على الرابط** أو انسخه في المتصفح وحمّل IPA! 🎉

---

## 📱 الخطوة 9: ثبّت IPA على آيفونك

### الطريقة 1: AltStore (الأسهل)

#### أ) ثبّت AltStore:
1. روح: https://altstore.io
2. حمّل AltStore لنظامك (Windows/Mac)
3. ثبّته وشغّله

#### ب) ثبّت AltStore على آيفونك:
1. وصّل آيفونك بالكمبيوتر (USB)
2. افتح iTunes (Windows) أو Finder (Mac)
3. في AltStore على الكمبيوتر، اختر Install AltStore
4. اختر آيفونك
5. أدخل Apple ID وباسورد

#### ج) ثبّت IPA:
1. افتح AltStore على آيفونك
2. اضغط على `+` (زر My Apps)
3. اختر ملف IPA اللي حملته
4. انتظر التثبيت

✅ **خلاص! التطبيق مثبت!**

---

### الطريقة 2: Sideloadly

1. حمّل: https://sideloadly.io
2. ثبّته وشغّله
3. وصّل آيفونك
4. اسحب ملف IPA إلى Sideloadly
5. أدخل Apple ID
6. اضغط Start

---

## ⚠️ ملاحظات مهمة:

### 1. الشهادة المجانية (7 أيام):
- إذا استخدمت Apple ID عادي (مجاني)
- التطبيق رح يشتغل **7 أيام فقط**
- بعدها لازم تجدده (تعيد التثبيت)

### 2. الشهادة المدفوعة (سنة):
- لو عندك Apple Developer Account ($99/سنة)
- التطبيق رح يشتغل **سنة كاملة**
- ما يحتاج تجديد

### 3. Trusted App:
أول مرة تشغل التطبيق:
- Settings → General → VPN & Device Management
- اضغط على إيميلك
- Trust

---

## 🆘 مشاكل محتملة وحلولها:

### مشكلة 1: "command not found: yarn"
```bash
npm install -g yarn
```

### مشكلة 2: "command not found: eas"
```bash
npm install -g eas-cli
```

### مشكلة 3: "Failed to authenticate"
```bash
eas logout
eas login
```

### مشكلة 4: البناء فشل
- تأكد من الإنترنت
- شغّل الأمر مرة ثانية

---

## 📞 تحتاج مساعدة؟

**إذا وقفت في أي خطوة:**
1. انسخ الخطأ اللي طلع
2. أرسله لي
3. رح أساعدك فوراً! 🚀

---

## ✅ الخلاصة السريعة:

```bash
# 1. ثبّت البرامج
npm install -g yarn eas-cli

# 2. روح لمجلد المشروع
cd path/to/accounting-ledger-app/frontend

# 3. ثبّت المكتبات
yarn install

# 4. سجل دخول
eas login

# 5. ابني
eas build --platform ios --profile production

# 6. انتظر وحمّل IPA
# 7. ثبّت باستخدام AltStore
```

---

**يلا! ابدأ من الخطوة 1 وقلي لما توصل أي خطوة** 💪🚀

حظ موفق! 🎉
