import React, { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion';
import SubwayLines from './SubwayLines';
import InteractionBlocker from './InteractionBlocker';
import { narrativeData } from './narrativeData';

const Content = ({ onChapterChange }) => {
    // Dynamic Background State
    // Scroll Interpolation Logic for Prologue -> Title (Black -> White)
    const titleZoneRef = useRef(null);
    const { scrollYProgress: titleProgress } = useScroll({
        target: titleZoneRef,
        offset: ["start end", "center center"] // Starts when top of Title hits bottom of Viewport
    });
    const backgroundColor = useTransform(titleProgress, [0, 1], ["#000000", "#ffffff"]);

    // Scroll Interpolation Logic for Title -> Narrative (White -> Transparent)
    const RMRRef = useRef(null);
    const { scrollYProgress: narrativeProgress } = useScroll({
        target: RMRRef,
        offset: ["start center", "end center"] // Starts when top of Narrative hits bottom
    });
    const opacity = useTransform(narrativeProgress, [0, 1], [1, 0]); // Fades out as element rises

    // State for dynamic subway stops
    const [stops, setStops] = useState({
        blue: ['line-start-blue'],
        orange: ['line-start-orange']
    });

    // Effect to automatically detect stations from the DOM
    useEffect(() => {
        // 1. Find all cards
        const leftCards = Array.from(document.querySelectorAll('.card-left'));
        const rightCards = Array.from(document.querySelectorAll('.card-right'));

        // 2. Extract IDs
        const blueStops = ['line-start-blue', ...leftCards.map(el => el.id).filter(id => id)];
        const orangeStops = ['line-start-orange', ...rightCards.map(el => el.id).filter(id => id)];

        // 3. Update state
        setStops({
            blue: blueStops,
            orange: orangeStops
        });
    }, []); // Run ONCE on mount

    return (
        <>
            {/* Dynamic Background Overlay */}
            <motion.div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor, // Interpolated by Scroll (Black -> White)
                    opacity, // Interpolated by Scroll (1 -> 0)
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            // No explicit transition prop needed for motion values, they are instant/sprung
            />

            <SubwayLines
                lines={[
                    { color: '#FF9900', width: 8, stops: stops.orange }, // Orange Line (Right side mainly)
                    { color: '#003399', width: 8, stops: stops.blue }  // Blue Line (Left side mainly)
                ]}
            />

            {/* === ZONE 1: WHITE BACKGROUND (TITLE) === */}
            <div className="bg-zone" data-opacity="1" data-color="#fff" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: '50vh' }}>
                <div
                    className="section"
                    style={{ zIndex: 1, position: 'relative', minWidth: '80vw', textAlign: 'center' }}
                >
                    <h1 ref={titleZoneRef} style={{ fontSize: '4rem', whiteSpace: 'nowrap' }}>{narrativeData.title.text}</h1>

                    {/* Diverging Start Points (Invisible) */}
                    <div id="line-start-blue" style={{ position: 'absolute', top: '15vh', left: '35%', height: '10px', width: '10px' }} />
                    <div id="line-start-orange" style={{ position: 'absolute', top: '15vh', left: '65%', height: '10px', width: '10px' }} />
                </div>
            </div>


            {/* === ZONE 2: TRANSPARENT BACKGROUND === */}
            <div className="bg-zone" data-opacity="0" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {narrativeData.cards.map((card, index) => (
                    <React.Fragment key={card.id}>
                        <InteractionBlocker>
                            <div
                                ref={index === 0 ? RMRRef : null}
                                className={`section card-filled ${card.align === 'right' ? 'card-right' : 'card-left'}`}
                                id={card.id}
                                style={{ zIndex: 1, pointerEvents: 'auto' }}
                            >
                                <p>{card.text}</p>
                            </div>
                        </InteractionBlocker>

                        {/* Remote Style Trigger: framer-motion viewport detection */}
                        {card.triggerAfter && (
                            <motion.div
                                onViewportEnter={() => onChapterChange && onChapterChange(card.triggerAfter)}
                                viewport={{ amount: 0.5 }}
                                style={{
                                    marginBottom: '10vh',
                                    height: '1px',
                                    width: '100%',
                                    pointerEvents: 'none'
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </>
    );
};

export default Content;
