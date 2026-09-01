import { Link } from "react-router-dom";

function Navbar() {
    return (
        <header className="navbar">
            <div className="navbar-container">

                <Link to="/" className="logo">
                    Foodly
                </Link>

                <nav className="nav-links">
                    <Link to="/">
                        Home
                    </Link>

                    <a href="#shops">
                        Restaurants
                    </a>

                    <a href="#about">
                        About
                    </a>

                    <Link to="/login">
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="nav-button"
                    >
                        Register
                    </Link>
                </nav>

            </div>
        </header>
    );
}

export default Navbar;