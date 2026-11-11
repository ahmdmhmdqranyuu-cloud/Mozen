import SwiftUI

public struct ZakatView: View {
    @Environment(\.presentationMode) var presentationMode

    @State private var cashStr: String = ""
    @State private var goldGramsStr: String = ""
    @State private var goldPricePerGramStr: String = "240" // Default gold price per gram in currency
    @State private var tradeGoodsStr: String = ""
    @State private var debtsStr: String = ""

    public init() {}

    private var cash: Double { Double(cashStr) ?? 0 }
    private var goldGrams: Double { Double(goldGramsStr) ?? 0 }
    private var goldPrice: Double { Double(goldPricePerGramStr) ?? 240 }
    private var tradeGoods: Double { Double(tradeGoodsStr) ?? 0 }
    private var debts: Double { Double(debtsStr) ?? 0 }

    private var nisabThreshold: Double {
        return 85.0 * goldPrice // 85 grams of pure gold
    }

    private var totalZakatableAssets: Double {
        let goldValue = goldGrams * goldPrice
        let total = cash + goldValue + tradeGoods - debts
        return max(0, total)
    }

    private var isNisabReached: Boolean {
        return totalZakatableAssets >= nisabThreshold
    }

    private var zakatDue: Double {
        return isNisabReached ? totalZakatableAssets * 0.025 : 0.0
    }

    public var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 18, weight: .bold))
                }
                Spacer()
                Text("حاسبة الزكاة الذكية")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "scalemass.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            ScrollView {
                VStack(spacing: 16) {
                    // Result Card
                    VStack(spacing: 10) {
                        Text("مقدار الزكاة الواجب إخراجها (2.5%)")
                            .font(.system(size: 13))
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))

                        Text(String(format: "%.2f", zakatDue))
                            .font(.system(size: 34, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                        HStack(spacing: 6) {
                            Circle()
                                .fill(isNisabReached ? Color(red: 16/255, green: 185/255, blue: 129/255) : Color(red: 239/255, green: 68/255, blue: 68/255))
                                .frame(width: 8, height: 8)
                            Text(isNisabReached ? "بلغ المال النصاب وحال عليه الحول فتجب الزكاة" : "المال لم يبلغ حد النصاب الشرعي (\(Int(nisabThreshold)))")
                                .font(.system(size: 12))
                                .foregroundColor(isNisabReached ? Color(red: 110/255, green: 231/255, blue: 183/255) : Color(red: 248/255, green: 113/255, blue: 113/255))
                        }
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity)
                    .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                    .cornerRadius(20)

                    // Inputs Card
                    VStack(alignment: .trailing, spacing: 14) {
                        Text("الأموال والممتلكات الزكوية")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                        ZakatInputField(title: "الأموال النقدية والودائع البنكية", placeholder: "0", text: $cashStr)
                        ZakatInputField(title: "وزن الذهب الزكوي بالجرام", placeholder: "0", text: $goldGramsStr)
                        ZakatInputField(title: "سعر جرام الذهب عيار 24 الحالي", placeholder: "240", text: $goldPricePerGramStr)
                        ZakatInputField(title: "قيمة عروض التجارة والبضائع", placeholder: "0", text: $tradeGoodsStr)
                        ZakatInputField(title: "الديون والالتزامات المستحقة حالاً (تُخصم)", placeholder: "0", text: $debtsStr)
                    }
                    .padding(18)
                    .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                    .cornerRadius(20)

                    // Fiqh Guidelines Card
                    VStack(alignment: .trailing, spacing: 6) {
                        Text("💡 تنبيه فقهي هام")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        Text("النصاب الشرعي للذهب هو 85 جراماً من الذهب الخالص (عيار 24)، ويشترط لوجوب الزكاة مرور حول قمري كامل (عام هجري) على امتلاك النصاب مع فائضه عن الحاجات الأصلية والدين.")
                            .font(.system(size: 12))
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                            .lineSpacing(4)
                            .multilineTextAlignment(.trailing)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity)
                    .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                    .cornerRadius(14)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}

struct ZakatInputField: View {
    let title: String
    let placeholder: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .trailing, spacing: 6) {
            Text(title)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))

            TextField(placeholder, text: $text)
                .keyboardType(.decimalPad)
                .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                .multilineTextAlignment(.trailing)
                .padding(12)
                .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                .cornerRadius(12)
        }
    }
}
