export default function About() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start max-w-2xl">
        <h1 className="text-4xl font-bold">About Me</h1>
        <div className="text-lg space-y-4">
          <p>I am Kasper.</p>
          <p>
            I am building my world, exploring the infinite possibilities of
            technology and creativity.
          </p>
        </div>
        <p> contact me: kasperr.pan@gmail.com</p>
        <p>
          here is my website: <a href="/">https://kasperbuild.com</a>
        </p>
        <a
          href="/"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Back to Home
        </a>
      </main>
    </div>
  );
}
