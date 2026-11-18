import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import {
  Quotation,
  QuotationSettings,
  formatCurrency,
  formatMoney,
  formatNumber,
  quotationTotals,
  rowTotal,
} from '../invoiceModel';

let fontsRegistered = false;

export function registerPdfFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: 'Cairo',
    fonts: [
      { src: '/fonts/Cairo-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/Cairo-Bold.ttf', fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const BLACK = '#000000';
const HEAD_BG = '#e9e9e9';

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 30,
    fontFamily: 'Cairo',
    fontSize: 10,
    color: BLACK,
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: BLACK,
    paddingBottom: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  company: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    lineHeight: 1.45,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 3,
    color: '#444444',
    textAlign: 'center',
  },
  tax: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 5,
    color: '#333333',
  },
  table: {
    borderWidth: 2,
    borderColor: BLACK,
  },
  row: {
    flexDirection: 'row-reverse',
    minHeight: 30,
  },
  headRow: {
    backgroundColor: HEAD_BG,
  },
  cell: {
    borderWidth: 0.75,
    borderColor: BLACK,
    paddingVertical: 7,
    paddingHorizontal: 5,
    textAlign: 'center',
    justifyContent: 'center',
  },
  headCell: {
    fontWeight: 700,
  },
  nameCell: {
    textAlign: 'right',
  },
  totalsWrap: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  totals: {
    width: 245,
    borderWidth: 2,
    borderColor: BLACK,
  },
  labelCell: {
    backgroundColor: HEAD_BG,
    fontWeight: 700,
    textAlign: 'right',
    width: '55%',
  },
  valueCell: {
    width: '45%',
  },
  grandLabel: {
    backgroundColor: BLACK,
    color: '#ffffff',
  },
  grandValue: {
    fontWeight: 700,
    fontSize: 11,
  },
  notesBox: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    textAlign: 'right',
    fontSize: 9.5,
    color: '#222222',
    lineHeight: 1.5,
  },
});

const COLS = ['8%', '36%', '12%', '12%', '16%', '16%'] as const;

export function PdfDocument({
  quotation,
  settings,
}: {
  quotation: Quotation;
  settings: QuotationSettings;
}) {
  const { subtotal, vat, grandTotal, effectiveVatRate } = quotationTotals(quotation);
  const heads = ['م', 'الصنف', 'الكمية', 'الوحدة', 'سعر الوحدة', 'الإجمالي'];
  const hasNotes = quotation.notes.trim().length > 0;

  return (
    <Document title="عرض سعر" author={settings.companyName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.company}>{settings.companyName}</Text>
          {settings.companySubtitle.trim() ? (
            <Text style={styles.subtitle}>{settings.companySubtitle.trim()}</Text>
          ) : null}
          {settings.taxId.trim() ? (
            <Text style={styles.tax}>ت.ض : {settings.taxId.trim()}</Text>
          ) : null}
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.headRow]} fixed>
            {heads.map((head, i) => (
              <Text key={head} style={[styles.cell, styles.headCell, { width: COLS[i] }]}>
                {head}
              </Text>
            ))}
          </View>

          {quotation.items.map((item, index) => (
            <View key={item.id} style={styles.row} wrap={false}>
              <Text style={[styles.cell, { width: COLS[0] }]}>{formatNumber(index + 1)}</Text>
              <Text style={[styles.cell, styles.nameCell, { width: COLS[1] }]}>
                {item.name || '—'}
              </Text>
              <Text style={[styles.cell, { width: COLS[2] }]}>{formatNumber(item.qty)}</Text>
              <Text style={[styles.cell, { width: COLS[3] }]}>{item.unit}</Text>
              <Text style={[styles.cell, { width: COLS[4] }]}>{formatMoney(item.price)}</Text>
              <Text style={[styles.cell, { width: COLS[5] }]}>
                {formatMoney(rowTotal(item))}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            {effectiveVatRate > 0 ? (
              <>
                <View style={styles.row}>
                  <Text style={[styles.cell, styles.labelCell]}>الإجمالي</Text>
                  <Text style={[styles.cell, styles.valueCell]}>
                    {formatCurrency(subtotal, settings.currency)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.cell, styles.labelCell]}>
                    الضريبة %{formatNumber(effectiveVatRate)}
                  </Text>
                  <Text style={[styles.cell, styles.valueCell]}>
                    {formatCurrency(vat, settings.currency)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.cell, styles.labelCell, styles.grandLabel]}>
                    الإجمالي بعد الضريبة
                  </Text>
                  <Text style={[styles.cell, styles.valueCell, styles.grandValue]}>
                    {formatCurrency(grandTotal, settings.currency)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.row}>
                <Text style={[styles.cell, styles.labelCell, styles.grandLabel]}>
                  الإجمالي النهائي
                </Text>
                <Text style={[styles.cell, styles.valueCell, styles.grandValue]}>
                  {formatCurrency(grandTotal, settings.currency)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {hasNotes ? (
          <View style={styles.notesBox}>
            <Text>ملاحظات: {quotation.notes.trim()}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
