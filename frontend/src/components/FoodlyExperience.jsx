import { useState } from "react";
import "../styles/FoodlyExperience.css";

function FoodlyExperience() {
    const [videoFinished, setVideoFinished] = useState(false);
    return (
        <section className="foodly-experience">

            <div className="foodly-experience-content">

                <div
    className={`foodly-experience-animation ${
        videoFinished ? "finished" : ""
    }`}
>
    <video
        className="burger-animation"
        src="/Burger-Animation-enhanced.mp4"
        autoPlay
        muted
        playsInline
        onEnded={() => setVideoFinished(true)}
    />
</div>

                <div
    className={`foodly-experience-text ${
        videoFinished ? "visible" : ""
    }`}
>
                    <span className="eyebrow">
                        FOODLY EXPERIENCE
                    </span>

                    <h2>
                        Good Food.
                        <br />
                        Good Mood.
                    </h2>

                    <p>
                        Discover delicious food from your favourite
                        restaurants and enjoy every bite.
                    </p>
                </div>

            </div>

        </section>
    );
}

export default FoodlyExperience;