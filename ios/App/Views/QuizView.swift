import SwiftUI
import UIKit

struct iOSQuizQuestion: Identifiable {
    let id: Int
    let category: String
    let question: String
    let options: [String]
    let correctIndex: Int
    let explanation: String
}

public struct QuizView: View {
    @Environment(\.presentationMode) var presentationMode

    private let questions: [iOSQuizQuestion] = [
        iOSQuizQuestion(
            id: 1,
            category: "القرآن الكريم",
            question: "ما هي أطول سورة في القرآن الكريم؟",
            options: ["سورة آل عمران", "سورة البقرة", "سورة النساء", "سورة المائدة"],
            correctIndex: 1,
            explanation: "سورة البقرة هي أطول سور القرآن بعدد 286 آية وفيها آية الكرسي وآية الدين."
        ),
        iOSQuizQuestion(
            id: 2,
            category: "القرآن الكريم",
            question: "ما هي السورة التي تعدل ثلث القرآن الكريم؟",
            options: ["سورة الفاتحة", "سورة الإخلاص", "سورة الكوثر", "سورة الفلق"],
            correctIndex: 1,
            explanation: "سورة الإخلاص تعدل ثلث القرآن الكريم لاشتمالها على توحيد الله الخالص وتنزيهه."
        ),
        iOSQuizQuestion(
            id: 3,
            category: "السيرة النبوية",
            question: "في أي عام هجري كانت غزوة بدر الكبرى؟",
            options: ["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الخامسة"],
            correctIndex: 1,
            explanation: "وقعت غزوة بدر الكبرى في 17 رمضان من العام الثاني للهجرة النبوية المشرفة."
        ),
        iOSQuizQuestion(
            id: 4,
            category: "الصحابة الكرام",
            question: "من هو الصحابي الجليل الملقب بأمين هذه الأمة؟",
            options: ["سعد بن أبي وقاص", "أبو عبيدة عامر بن الجراح", "عثمان بن عفان", "علي بن أبي طالب"],
            correctIndex: 1,
            explanation: "قال النبي ﷺ: «لكل أمة أمين، وأمين هذه الأمة أبو عبيدة بن الجراح»."
        ),
        iOSQuizQuestion(
            id: 5,
            category: "الفقه الإسلامي",
            question: "ما هو الركن الثاني من أركان الإسلام؟",
            options: ["إيتاء الزكاة", "إقامة الصلاة", "صوم رمضان", "حج البيت"],
            correctIndex: 1,
            explanation: "بني الإسلام على خمس وأعظمها بعد الشهادتين إقام الصلاة المكتوبة."
        )
    ]

    @State private var currentIndex: Int = 0
    @State private var selectedOption: Int? = nil
    @State private var isAnswered: Bool = false
    @State private var score: Int = 0
    @State private var quizFinished: Bool = false

    public init() {}

    private var currentQ: iOSQuizQuestion? {
        currentIndex < questions.count ? questions[currentIndex] : nil
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
                Text("المسابقات الإسلامية")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "checkmark.seal.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            if quizFinished {
                // Completed Card
                VStack(spacing: 18) {
                    Spacer()
                    Circle()
                        .fill(Color(red: 245/255, green: 158/255, blue: 11/255).opacity(0.2))
                        .frame(width: 80, height: 80)
                        .overlay(
                            Image(systemName: "trophy.fill")
                                .font(.system(size: 40))
                                .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        )

                    Text("بارك الله فيك!")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                    Text("لقد أتممت أسئلة المسابقة بنجاح")
                        .font(.system(size: 14))
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))

                    Text("\(score) / \(questions.count)")
                        .font(.system(size: 42, weight: .bold))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))

                    Button(action: {
                        currentIndex = 0
                        selectedOption = nil
                        isAnswered = false
                        score = 0
                        quizFinished = false
                    }) {
                        Text("إعادة المسابقة")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(Color(red: 9/255, green: 36/255, blue: 28/255))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(red: 245/255, green: 158/255, blue: 11/255))
                            .cornerRadius(14)
                    }
                    .padding(.horizontal, 30)
                    .padding(.top, 10)

                    Spacer()
                }
            } else if let q = currentQ {
                ScrollView {
                    VStack(spacing: 16) {
                        // Progress
                        HStack {
                            Text("السؤال \(currentIndex + 1) من \(questions.count)")
                                .font(.system(size: 13))
                                .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                            Spacer()
                            Text(q.category)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                                .cornerRadius(8)
                        }

                        // Question Card
                        Text(q.question)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                            .lineSpacing(6)
                            .multilineTextAlignment(.trailing)
                            .padding(20)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                            .cornerRadius(18)

                        // Options
                        VStack(spacing: 10) {
                            ForEach(0..<q.options.count, id: \.self) { idx in
                                let optText = q.options[idx]
                                let isSelected = selectedOption == idx
                                let isCorrect = idx == q.correctIndex

                                Button(action: {
                                    if !isAnswered {
                                        selectedOption = idx
                                        isAnswered = true
                                        if isCorrect {
                                            score += 1
                                            UINotificationFeedbackGenerator().notificationOccurred(.success)
                                        } else {
                                            UINotificationFeedbackGenerator().notificationOccurred(.error)
                                        }
                                    }
                                }) {
                                    HStack {
                                        if isAnswered {
                                            if isCorrect {
                                                Image(systemName: "checkmark.circle.fill")
                                                    .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))
                                            } else if isSelected {
                                                Image(systemName: "xmark.circle.fill")
                                                    .foregroundColor(Color(red: 239/255, green: 68/255, blue: 68/255))
                                            }
                                        }

                                        Spacer()

                                        Text(optText)
                                            .font(.system(size: 15, weight: .medium))
                                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                                    }
                                    .padding(14)
                                    .background(
                                        isAnswered && isCorrect ? Color(red: 16/255, green: 185/255, blue: 129/255).opacity(0.3) :
                                        isAnswered && isSelected && !isCorrect ? Color(red: 239/255, green: 68/255, blue: 68/255).opacity(0.3) :
                                        Color(red: 19/255, green: 56/255, blue: 45/255)
                                    )
                                    .cornerRadius(14)
                                }
                                .disabled(isAnswered)
                            }
                        }

                        // Explanation & Next Button
                        if isAnswered {
                            VStack(alignment: .trailing, spacing: 6) {
                                Text("💡 الفائدة العلمية:")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                                Text(q.explanation)
                                    .font(.system(size: 13))
                                    .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                                    .lineSpacing(4)
                                    .multilineTextAlignment(.trailing)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                            .cornerRadius(12)

                            Button(action: {
                                if currentIndex + 1 < questions.count {
                                    currentIndex += 1
                                    selectedOption = nil
                                    isAnswered = false
                                } else {
                                    quizFinished = true
                                }
                            }) {
                                Text(currentIndex + 1 < questions.count ? "السؤال التالي" : "عرض النتيجة النهائية")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(Color(red: 9/255, green: 36/255, blue: 28/255))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Color(red: 245/255, green: 158/255, blue: 11/255))
                                    .cornerRadius(12)
                            }
                            .padding(.top, 6)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)
                }
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}
