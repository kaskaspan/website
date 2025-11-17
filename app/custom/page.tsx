"use client";
export default function CustomPage() {
  return (
    <div>
      <HappyButton />
    </div>
  );
}

const HappyButton = () => {
  return <button onClick={() => alert("I am happy")}>I am happy button</button>;
};
