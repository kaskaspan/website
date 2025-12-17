
export async function loadKasperWonderDiary(): Promise<{ title: string; text: string }> {
  // Example text. You can swap this with an actual fetch from Supabase.
  const title = "Kasper Wonder Diary — Chapter 1";
  const text = [
    "My Car Factory",
    "One day, I opened a car factory with many big rooms. In my factory, there are lots of robots. These robots can carry parts, move them around, and assemble them into machines.",
    "If you want a car, all you need to do is tell the machine! You can customize the car by choosing its color, design, and features both inside and outside using a touchscreen.",
    "The process begins with hot liquid metal. A robot pumps this liquid into a machine that creates the car’s frame. This machine molds the entire outer shell of the car. If you want a special design, you can choose it on the screen, and the robot will create it for you.",
    "But it’s not just about the outside. You can also design the interior of the car. Once your choices are sent to the robots, they start working immediately. Each room has a robot that can make one car in just one minute!",
    "First, the robot uses metal to build the frame in just one second.",
    "Next, the robot assembles the engine. It works very fast, putting all the parts together and installing the engine inside the car. You can also choose the size of the fuel tank—just select how many liters you want, and the robot will create it. The robot heats metal, shapes it into the fuel tank, and installs it.
    "Then, you can pick the seats. Do you want standard seats, or something more unique? Once you decide, the robot will add the floors and attach all the parts to the frame. At this stage, the car looks unpainted.
    "Next, the robot moves the car to a painting room. You’ll be directed to a safe spot to watch while the walls close to prevent paint from spilling onto your clothes. After painting, the robot can add extra features like interior lights or other custom options—just tell the robot what you want.
    "Finally, when the car is complete, it will drive itself out of the factory! That’s because each car has a built-in driving robot. You can even see the robot inside the control center of the car.
    "When you go to the cashier, the car will generate a code. Once you scan the code, the payment will automatically be deducted from your account. If you want another car just like it, the robot can scan the first car and create an identical twin!
    "We look forward to your visit!      "
  ].join("\n");

  return { title, text };
}
