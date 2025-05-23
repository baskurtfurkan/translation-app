# Çok Dilli Sesli İletişim Uygulaması

## Proje Hakkında
Bu proje, farklı dilleri konuşan kullanıcılar arasında gerçek zamanlı sesli iletişimi mümkün kılan bir web uygulamasıdır. Uygulama, Google Cloud servisleri kullanarak konuşma tanıma, dil çevirisi ve metin-ses dönüşümü özelliklerini entegre eder.

## Teknolojik Altyapı

### Frontend (React + TypeScript)
- React 18
- TypeScript
- Socket.IO Client
- Styled Components
- Google Cloud API'leri entegrasyonu

### Backend (Python + FastAPI)
- FastAPI framework
- Python-SocketIO
- Google Cloud Servisleri:
  - Speech-to-Text
  - Translation
  - Text-to-Speech
- MongoDB veritabanı bağlantısı
- Uvicorn ASGI sunucusu

## Mevcut Özellikler
1. Gerçek zamanlı ses kaydı ve işleme
2. Çoklu dil desteği ile anlık çeviri
3. Metin-ses dönüşümü
4. WebSocket üzerinden gerçek zamanlı iletişim
5. Güvenli kullanıcı kimlik doğrulama

## Proje Yapısı
```
├── frontend/               # React uygulaması
│   ├── src/               # Kaynak kodları
│   ├── public/            # Statik dosyalar
│   └── package.json       # Bağımlılıklar ve scripts
│
├── backend/               # FastAPI uygulaması
│   ├── src/              # Kaynak kodları
│   ├── app/              # Ana uygulama modülleri
│   └── requirements.txt  # Python bağımlılıkları
│
└── venv/                 # Python sanal ortamı
```

## Kurulum

### Backend Kurulumu
1. Python sanal ortamını aktifleştirin:
   ```
   source venv/bin/activate  # Unix/MacOS
   venv\Scripts\activate     # Windows
   ```
2. Bağımlılıkları yükleyin:
   ```
   pip install -r backend/requirements.txt
   ```
3. Google Cloud kimlik bilgilerini yapılandırın
4. Backend sunucusunu başlatın:
   ```
   uvicorn app.main:app --reload
   ```

### Frontend Kurulumu
1. Bağımlılıkları yükleyin:
   ```
   cd frontend
   npm install
   ```
2. Geliştirme sunucusunu başlatın:
   ```
   npm start
   ```

## Güvenlik
- Google Cloud kimlik bilgileri güvenli bir şekilde saklanmalıdır
- Kullanıcı kimlik doğrulama sistemi mevcuttur
- CORS politikaları yapılandırılmıştır

## Gelecek Geliştirmeler
- [ ] Grup sohbet özelliği
- [ ] Ses kayıtlarının arşivlenmesi
- [ ] Daha fazla dil desteği
- [ ] Kullanıcı arayüzü iyileştirmeleri
- [ ] Performans optimizasyonları

## Lisans
Bu proje özel kullanım için geliştirilmiştir. 