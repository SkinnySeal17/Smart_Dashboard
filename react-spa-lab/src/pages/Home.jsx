import { useState } from "react";
import Card from "../components/Card";

export default function Home() {
	const [count, setCount] = useState(0);

	return (
		<Card title="Home Page">
			<p>Welcome to the Home Page</p>
			<p>You clicked {count} times</p>
			<button onClick={() => setCount(count + 1)}>Click Me</button>
		</Card>
	);
}