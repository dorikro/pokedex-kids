"use client";

import { useTranslation } from "@/lib/i18n/index";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.about.welcome}</h1>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
            {t.about.description}
          </p>
        </div>

        {/* Features */}
        <div className="p-6 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-gray-800">{t.about.whatCanYouDo}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {t.about.features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2"
              >
                <h3 className="font-semibold text-gray-800">{feature.heading}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Fun fact */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="font-semibold text-yellow-800 mb-1">{t.about.funFact}</p>
            <p className="text-sm text-yellow-700">{t.about.funFactText}</p>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400 pt-2">
            {t.about.builtWith}
          </p>
        </div>
      </div>
    </div>
  );
}
