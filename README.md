# Einkaufsrechner Card

A Lovelace card for Home Assistant to track shopping expenses per shop and person – with a settle-up for two people
(“who paid more, and since when?”). Everything is stored in a **local to-do list**, no extra integration needed.
Follows your Home Assistant theme (light and dark). Texts in German and English.

*Deutsch weiter unten.*

## Features
- Enter an amount, pick the shop and who paid, save. Today, yesterday or any other day.
- Spending per shop for week / month / year, browse back in time, tap a bar or the total for all purchases.
- Settle-up for exactly two people: who is ahead, by how much, and a chart since the last settle-up.
- Add your own shops right in the card (“＋”), with an uploaded logo or a color and initial.
- Purchases in “Other” can be reassigned to a shop with one tap.
- Optional (Austria): scan receipts. The RKSV QR code fills in amount and date; Spar’s barcode fills in the date and
  the total is read with on-device text recognition (only accepted if it matches the VAT table). Tills are remembered
  per shop, duplicates are detected. Nothing leaves the device.

## Installation (HACS)
1. HACS → ⋮ → *Custom repositories* → add `https://github.com/dproneg-commits/einkaufsrechner-card`, type *Dashboard*.
2. Install **Einkaufsrechner Card**. HACS adds the resource `/hacsfiles/einkaufsrechner-card/einkaufsrechner-card.js`
   as *JavaScript module* (if you add it by hand, it must be type **module**).
3. Create the storage list: Settings → Devices & services → Add integration → **Local To-do** → e.g. “Einkaufsrechner”.
4. Dashboard → Add card → **Einkaufsrechner**. Configure everything in the visual editor.

## Configuration
```yaml
type: custom:einkaufsrechner-card
entity: todo.einkaufsrechner      # required: a local to-do list
people:                           # 2 people → settle-up is shown
  - name: Anna
    user: Anna                    # optional: HA user name or id → preselected for this user
    color: "#4dd0e1"
  - name: Ben
shops:                            # optional; "Other" is added automatically
  - name: Supermarket
    color: "#81c784"
    logo: /local/logos/supermarket.png   # optional
  - name: Bakery
currency: EUR                     # ISO code, default EUR
scan: true                        # receipt scanning (default: on when HA country is AT)
ocr: true                         # read the total with text recognition (default true)
add_shops: true                   # show the "＋" tile (default true)
keypad: auto                      # auto (wide layout) | on | off
recent: 0                         # recent purchases shown (0 = auto: 4 wide, 8 narrow)
reset_after: 120                  # reset selection after N seconds without touch (0 = never)
```
Advanced: `qr_lib` and `ocr_path` override where jsQR and Tesseract are loaded from (default: next to the card file,
then CDN). Mark one of your shops with `other: true` to use it as the “Other” bucket.

### Data
Each purchase is a to-do item like `🛒 Bakery · €12.40 · Anna`, the data is JSON in the description. You can see the items
in the to-do list, but please only change them through the card.

## Notes
- Receipt scanning reads Austrian receipts (RKSV QR code) and the Spar barcode format. Other receipts: type the amount.
  On a desktop without camera you can still pick a photo file.
- The bundled jsQR and Tesseract files (≈11 MB) are only downloaded by the browser when you scan a receipt.
- Licenses: card MIT, bundled libraries Apache-2.0 – see `THIRD_PARTY_NOTICES.md`.

---

## Deutsch

Karte für Einkäufe pro Laden und Person, mit Ausgleich für zwei Personen. Gespeichert wird in einer **lokalen To-do-Liste**.
Passt sich dem Home-Assistant-Theme an (hell und dunkel), Texte auf Deutsch und Englisch.

**Installation:** HACS → ⋮ → Benutzerdefinierte Repositories → `https://github.com/dproneg-commits/einkaufsrechner-card`, Typ *Dashboard*,
installieren. Dann unter Einstellungen → Geräte & Dienste → Integration hinzufügen → **Lokale To-do-Liste** eine Liste anlegen
(z. B. „Einkaufsrechner“) und im Dashboard die Karte **Einkaufsrechner** hinzufügen. Alles lässt sich im Karten-Editor einstellen.

**Bon scannen (Österreich, RKSV):** „📷 Bon“ im Betragsfeld. Der QR-Code liefert Betrag und Datum, beim Spar-Strichcode
kommt das Datum aus dem Code und die Summe per Texterkennung am Gerät (nur wenn sie zur MwSt-Tabelle passt). Beim ersten
Bon einer Kasse wählst du den Laden, danach wird er erkannt. Doppelte Bons werden erkannt. Standardmäßig ein, wenn in
Home Assistant als Land Österreich eingestellt ist.

**Läden:** „＋“ in der Karte legt einen eigenen Laden an (Name, Logo als Foto, Farbe). Markenlogos sind nicht dabei.
Einkäufe bei „Sonstige“ lassen sich antippen und einem Laden zuordnen.

**Ausgleich:** Bei genau zwei Personen zeigt die Karte, wer wie viel vorne liegt und bis wann Gleichstand war.
„Ausgeglichen ✓“ (zweimal tippen) beginnt die Zählung neu, die Statistik bleibt.
