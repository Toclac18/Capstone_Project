export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to My App
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            This is a basic Next.js application with Header and Footer layout.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold mb-3 text-gray-900">Feature 1</h2>
              <p className="text-gray-600">
                Description for feature 1 goes here.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold mb-3 text-gray-900">Feature 2</h2>
              <p className="text-gray-600">
                Description for feature 2 goes here.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold mb-3 text-gray-900">Feature 3</h2>
              <p className="text-gray-600">
                Description for feature 3 goes here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
