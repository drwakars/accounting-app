# 📱 دليل بناء ملف IPA للآيفون

## الطرق المتاحة لبناء ملف IPA

هناك 3 طرق لبناء ملف IPA لتطبيق دفتر الحسابات:

---

## 🌟 الطريقة 1: EAS Build (الموصى بها)

هذه الطريقة **الأسهل والأفضل** ولا تحتاج Mac!

### الخطوات:

#### 1. تثبيت EAS CLI
```bash
npm install -g eas-cli
```

#### 2. تسجيل الدخول
```bash
eas login
```
> ستحتاج إنشاء حساب Expo إذا لم يكن لديك

#### 3. الانتقال لمجلد المشروع
```bash
cd /app/frontend
```

#### 4. بناء IPA للـ iOS
```bash
eas build --platform ios --profile production
```

#### 5. انتظر البناء
- سيتم رفع المشروع إلى خوادم Expo
- البناء يستغرق حوالي 15-20 دقيقة
- ستحصل على رابط لتتبع البناء

#### 6. تحميل الملف
- بعد اكتمال البناء، ستحصل على رابط لتحميل IPA
- حمّل الملف على جهازك

### ملاحظات مهمة:
- ✅ لا تحتاج Mac
- ✅ لا تحتاج Xcode
- ⚠️ تحتاج حساب Expo (مجاني)
- ⚠️ للنشر على App Store تحتاج حساب Apple Developer ($99/سنة)

---

## 📱 الطريقة 2: التجربة الفورية عبر Expo Go (بدون IPA)

أسهل طريقة للتجربة **بدون بناء IPA**!

### الخطوات:

#### 1. حمّل تطبيق Expo Go
من App Store: [Expo Go](https://apps.apple.com/app/expo-go/id982107779)

#### 2. افتح التطبيق
- اختر "Scan QR Code"

#### 3. امسح QR Code أو افتح الرابط
```
https://offline-ios-app-2.preview.emergentagent.com
```

#### 4. جرّب التطبيق
- التطبيق سيعمل مباشرة على جهازك!
- يمكنك اختبار جميع المميزات

### المزايا:
- ✅ لا يحتاج بناء IPA
- ✅ تحديثات فورية
- ✅ سهل وسريع
- ⚠️ يحتاج اتصال بالإنترنت للتحميل الأول
- ⚠️ ليس تطبيق مستقل (يعمل داخل Expo Go)

---

## 💻 الطريقة 3: البناء المحلي (يتطلب Mac)

**متطلبات:**
- جهاز Mac
- Xcode مثبّت
- حساب Apple Developer (للتثبيت على جهاز حقيقي)

### الخطوات:

#### 1. تثبيت Xcode
من App Store: [Xcode](https://apps.apple.com/app/xcode/)

#### 2. الانتقال لمجلد المشروع
```bash
cd /app/frontend
```

#### 3. تشغيل البناء
```bash
npx expo run:ios
```

#### 4. البناء للجهاز (اختياري)
```bash
npx expo run:ios --device
```

### لإنشاء IPA من Xcode:
1. افتح المشروع في Xcode: `ios/[project].xcworkspace`
2. اختر Product > Archive
3. بعد الانتهاء، اختر Distribute App
4. اختر طريقة التوزيع (Ad Hoc, Development, App Store)
5. احفظ ملف IPA

---

## 🔧 تخصيص قبل البناء

### تغيير معلومات التطبيق:

في ملف `/app/frontend/app.json`:

```json
{
  "expo": {
    "name": "دفتر الحسابات",  // ← اسم التطبيق
    "slug": "accounting-ledger",
    "version": "1.0.0",  // ← رقم الإصدار
    "ios": {
      "bundleIdentifier": "com.accountingledger.app"  // ← معرف التطبيق
    }
  }
}
```

### تغيير الأيقونة والشعار:

ضع الصور في:
- `/app/frontend/assets/images/icon.png` (1024x1024)
- `/app/frontend/assets/images/splash-icon.png` (للشاشة الافتتاحية)

---

## 📦 التثبيت على الآيفون

### بعد الحصول على IPA:

#### الطريقة 1: عبر Apple Configurator (Mac)
1. حمّل Apple Configurator
2. وصّل الآيفون بالـ Mac
3. اسحب ملف IPA إلى الجهاز

#### الطريقة 2: عبر AltStore
1. حمّل AltStore
2. ثبّت AltStore على جهازك
3. استخدم "Install IPA"

#### الطريقة 3: عبر TestFlight (للاختبار)
1. ارفع IPA إلى App Store Connect
2. أضف مختبرين
3. حمّل TestFlight وجرّب

---

## 🎯 توصيات

### للاختبار السريع:
✅ **استخدم Expo Go** (الطريقة 2)

### للاستخدام الشخصي:
✅ **استخدم EAS Build** (الطريقة 1)

### للنشر على App Store:
✅ **استخدم EAS Build** + Apple Developer Account

---

## ❓ الأسئلة الشائعة

### س: هل أحتاج Mac لبناء IPA؟
ج: لا! يمكنك استخدام EAS Build بدون Mac.

### س: كم تكلفة بناء IPA؟
ج: EAS Build مجاني مع قيود. الخطة المدفوعة $29/شهر.

### س: هل يمكنني نشر التطبيق على App Store؟
ج: نعم، ستحتاج:
- حساب Apple Developer ($99/سنة)
- بناء IPA عبر EAS
- رفع التطبيق إلى App Store Connect

### س: التطبيق يعمل أوفلاين؟
ج: نعم! بعد التثبيت، يعمل بدون إنترنت تماماً.

### س: هل يمكنني تعديل التطبيق؟
ج: نعم! جميع الملفات المصدرية متوفرة في `/app/frontend`

---

## 🆘 المساعدة

إذا واجهت مشاكل:

1. **راجع السجلات:**
```bash
eas build:list
eas build:view [build-id]
```

2. **تحقق من التكوين:**
```bash
eas build:configure
```

3. **نظّف وأعد المحاولة:**
```bash
cd /app/frontend
rm -rf node_modules
yarn install
eas build --platform ios --profile production --clear-cache
```

---

## 📚 روابط مفيدة

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [Apple Developer](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)

---

**نجحت؟** 🎉 التطبيق الآن جاهز على آيفونك!

**تم البناء بـ ❤️ باستخدام Emergent AI**
