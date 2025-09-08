'use client';

import { useState } from 'react';

export default function Home() {
  const [shop, setShop] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [creditScore, setCreditScore] = useState<any>(null);

  const handleAuth = () => {
    if (!shop) {
      alert('Please enter a shop domain');
      return;
    }
    
    window.location.href = `/api/auth?shop=${shop}`;
  };

  const requestCreditScore = async () => {
    if (!shop) {
      alert('Please enter a shop domain');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/credit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop }),
      });

      const data = await response.json();
      console.log('Credit score request:', data);
      
      setTimeout(async () => {
        const resultResponse = await fetch(`/api/credit-score/result?shop=${shop}`);
        const resultData = await resultResponse.json();
        setCreditScore(resultData);
        setIsLoading(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error requesting credit score:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Shopify Credit Score Calculator
          </h1>
          <p className="text-gray-600 mb-8">
            Get instant credit assessment for revenue-based financing
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Domain
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  placeholder="yourstore.myshopify.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAuth}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect Shop
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <button
                onClick={requestCreditScore}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Calculating...' : 'Calculate Credit Score'}
              </button>
            </div>

            {creditScore && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Credit Assessment Results</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Credit Score</p>
                      <p className={`text-2xl font-bold ${
                        creditScore.score >= 75 ? 'text-green-600' :
                        creditScore.score >= 55 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {creditScore.score}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <p className="text-2xl font-bold capitalize">
                        {creditScore.riskLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="text-lg font-semibold">
                        ${(creditScore.monthlyRevenue / 100).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Eligible Funding</p>
                      <p className="text-lg font-semibold">
                        ${(creditScore.eligibleFunding / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {creditScore.recommendations && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {creditScore.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Connect Your Store</h3>
                <p className="text-gray-600">Securely authenticate with your Shopify store</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Analyze Metrics</h3>
                <p className="text-gray-600">We analyze your sales, customers, and growth trends</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Get Your Score</h3>
                <p className="text-gray-600">Receive instant credit assessment and funding eligibility</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}