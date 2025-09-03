# User Credentials - Temsada Batarya Üretim Departmanı

## Admin Account
- **Username:** admin
- **Password:** Securepassword1
- **Role:** ADMIN
- **Access:** Full system access

## User Accounts

### Batarya Paketleme Ekibi
| Name | Username | Password | Email |
|------|----------|----------|-------|
| Ali AĞCAKOYUNLU | ali.agcakoyunlu | K9m2P8x1 | ali.agcakoyunlu@temsa.com |
| Berkay ŞİMŞEK | berkay.simsek | N7w5Q2z9 | berkay.simsek@temsa.com |
| Canberk ALBAY | canberk.albay | R4t8Y6u3 | canberk.albay@temsa.com |
| Ekrem ATICI | ekrem.atici | L1s9D4h7 | ekrem.atici@temsa.com |
| Fatih Rüştü PITIR | fatih.pitir | M3x6B9k2 | fatih.rustu.pitir@temsa.com |
| Hüseyin Can SAK | huseyin.sak | P8v2C5n1 | huseyin.can.sak@temsa.com |
| Kemal TAŞTAN | kemal.tastan | Q4j7F3w6 | kemal.tastan@temsa.com |
| Oğuzhan İNANDI | oguzhan.inandi | T9r2E8y5 | oguzhan.inandi@temsa.com |
| Ömer ARISOY | omer.arisoy | V6k4H9s2 | omer.arisoy@temsa.com |
| Samet DANACI | samet.danaci | W1q8L6p4 | samet.danaci@temsa.com |
| Yaşar DOĞAN | yasar.dogan | Z3m7N2c9 | yasar.dogan@temsa.com |
| Yunus Emre KOÇ | yunus.koc | A8b5R1x7 | yunus.emre.koc@temsa.com |
| Yusuf KEBÜDE | yusuf.kebude | D4g9T6v2 | yusuf.kebude@temsa.com |

### Batarya Geliştirme Ekibi
| Name | Username | Password | Email |
|------|----------|----------|-------|
| Arda SÖNMEZ | arda.sonmez | F2k8W5j3 | arda.sonmez@temsa.com |
| Batuhan SALICI | batuhan.salici | G7n4Q9m1 | batuhan.salici@temsa.com |
| Berk ERTÜRK | berk.erturk | H5p2L8c6 | berk.erturk@temsa.com |
| Biran Can TÜRE | biran.ture | J9x3V7b4 | biran.can.ture@temsa.com |
| Esra DÖNMEZ | esra.donmez | K1f6S2n8 | esra.donmez@temsa.com |
| Mete Han KUŞDEMİR | mete.kusdemir | L4h9R5t7 | mete.han.kusdemir@temsa.com |
| Muhammed KARAKUŞ | muhammed.karakus | M8d2Y6w3 | muhammed.karakus@temsa.com |
| Murat KARA | murat.kara | N3z7E9q1 | murat.kara@temsa.com |
| Selim AKBUDAK | selim.akbudak | O6s4I8u5 | selim.akbudak@temsa.com |

### Satın Alma Ekibi
| Name | Username | Password | Email |
|------|----------|----------|-------|
| Fatih AVCI | fatih.avci | P2v8X4k9 | fatih.avci@temsa.com |
| Polen ACIMIŞ | polen.acimis | Q7c1Z3m6 | polen.acimis@temsa.com |

### Proje Geliştirme Ekibi
| Name | Username | Password | Email |
|------|----------|----------|-------|
| Gökhan BİLGİN | gokhan.bilgin | R9f5A2l8 | gokhan.bilgin@temsa.com |

---

## Password Policy
- All passwords are 8 characters long
- Mix of uppercase, lowercase, and numbers
- Randomly generated for security
- Users should change passwords on first login (feature to be implemented)

## Login Instructions
1. Go to `/login` page
2. Select "Kullanıcı Girişi" for regular users or "Yönetici Girişi" for admin
3. Enter username and password from the table above
4. Regular users will have access to calendar view only
5. Admin will have access to the full system

## Security Notes
- All passwords are hashed using bcrypt before storage
- JWT tokens expire after 24 hours
- Admin credentials should be changed in production
- Consider implementing password change functionality
