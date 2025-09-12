export default function Hero() {
  return (
    <div className="bg-gradient-to-b from-sky-50 to-white">
      {/* Revolutionary crypto funding hero */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Uncollateralized funding for the first time in crypto 🚀
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Revenue-based financing brings proven traditional finance methods to DeFi. No collateral, no liquidations, just shared growth.
          </p>
        </div>
      </div>

      {/* Current stats section */}
      <div className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">
            Crowdfunded business growth, repaid from existing revenue
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-sky-600 mb-2">$1K - $10M</div>
              <div className="text-gray-600">Funding Range</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-sky-600 mb-2">5% - 20%</div>
              <div className="text-gray-600">Revenue Share</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-sky-600 mb-2">1.1x - 3x</div>
              <div className="text-gray-600">Return Cap</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}