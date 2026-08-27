import { Link } from "react-router-dom";
export default function Navbar() {
return (
<nav aria-label="Main Navigation">
<ul>
<li><Link to="/">Home</Link></li>
<li><Link to="/about">About</Link></li>
	<li><Link to="/services">Services</Link></li>
</ul>
</nav>
);
}