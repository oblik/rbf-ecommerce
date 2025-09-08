export default function Hero() {
  return (
    <div className="bg-gradient-to-b from-green-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Revenue-Based Financing for Growing Businesses
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Get the capital you need to grow, pay it back as you earn. No equity dilution, no personal guarantees.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-2">$1K - $10M</div>
            <div className="text-gray-600">Funding Range</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-2">5% - 20%</div>
            <div className="text-gray-600">Revenue Share</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-2">1.1x - 3x</div>
            <div className="text-gray-600">Return Cap</div>
          </div>
        </div>
      </div>
    </div>
  );
}