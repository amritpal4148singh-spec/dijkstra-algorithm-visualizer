const graph = {
    A: { B: 4, F: 3, G: 5 },
    B: { A: 4, C: 3, G: 2 },
    C: { B: 3, D: 2, H: 3, I: 4 },
    D: { C: 2, E: 4, I: 2 },
    E: { D: 4, J: 3 },

    F: { A: 3, G: 2, K: 4, L: 3 },
    G: { A: 5, B: 2, F: 2, H: 4, L: 3 },
    H: { G: 4, C: 3, I: 3, M: 2, N: 4 },
    I: { H: 3, D: 2, J: 2, N: 3 },
    J: { I: 2, E: 3, O: 2 },

    K: { F: 4, L: 3, P: 2, Q: 5 },
    L: { K: 3, G: 3, M: 2, Q: 4 },
    M: { L: 2, H: 2, N: 4, R: 3, S: 4 },
    N: { M: 4, I: 3, O: 3, S: 2, H: 4 },
    O: { N: 3, J: 2, T: 4 },

    P: { K: 2, Q: 4 },
    Q: { P: 4, L: 4, R: 3, K: 5 },
    R: { Q: 3, M: 3, S: 2 },
    S: { R: 2, N: 2, T: 3, M: 4 },
    T: { S: 3, O: 4 }
};


/* ================= GLOBAL DATA ================= */

const blockedEdges = new Set();

const roadWeights = {};

const trafficLevels = {};

const trafficMultiplier = {
    low: 1,
    medium: 1.5,
    heavy: 2
};

let isRunning = false;


/* ================= EDGE KEY ================= */

function getEdgeKey(a, b) {
    return [a, b].sort().join("-");
}


/* ================= ROAD WEIGHTS ================= */

Object.keys(graph).forEach(from => {

    Object.keys(graph[from]).forEach(to => {

        const key = getEdgeKey(from, to);

        if (roadWeights[key] === undefined) {
            roadWeights[key] = graph[from][to];
        }

        if (trafficLevels[key] === undefined) {
            trafficLevels[key] = "low";
        }

    });

});


function getEffectiveWeight(from, to) {

    const key = getEdgeKey(from, to);

    const baseWeight = roadWeights[key];

    const traffic = trafficLevels[key];

    const multiplier = trafficMultiplier[traffic];

    return baseWeight * multiplier;
}


/* ================= DOM HELPERS ================= */

function getNodeElement(node) {
    return document.getElementById(`node-${node}`);
}


function getEdgeElement(key) {
    return document.getElementById(`edge-${key}`);
}


/* ================= GRAPH STYLING ================= */

function clearGraphStyles() {

    document.querySelectorAll(".node").forEach(node => {

        node.classList.remove(
            "start",
            "destination",
            "current-node",
            "visited-node",
            "path-node"
        );

    });


    document.querySelectorAll(".edge").forEach(edge => {

        edge.classList.remove(
            "active-edge",
            "updated-edge",
            "final-path",
            "animate-path",
            "road-selectable",
            "blocked-edge",
            "selected-road"
        );

    });

}


function setStartNode(node) {

    const element = getNodeElement(node);

    if (element) {
        element.classList.add("start");
    }

}


function setDestinationNode(node) {

    const element = getNodeElement(node);

    if (element) {
        element.classList.add("destination");
    }

}


function setCurrentNode(node) {

    document.querySelectorAll(".current-node")
        .forEach(element => {
            element.classList.remove("current-node");
        });

    const element = getNodeElement(node);

    if (element) {
        element.classList.add("current-node");
    }

}


function setVisitedNode(node) {

    const element = getNodeElement(node);

    if (element) {

        element.classList.remove("current-node");

        element.classList.add("visited-node");

    }

}


function setActiveEdge(a, b) {

    const key = getEdgeKey(a, b);

    const edge = getEdgeElement(key);

    if (edge) {
        edge.classList.add("active-edge");
    }

}


function setUpdatedEdge(a, b) {

    const key = getEdgeKey(a, b);

    const edge = getEdgeElement(key);

    if (edge) {
        edge.classList.add("updated-edge");
    }

}


function clearActiveEdges() {

    document.querySelectorAll(".active-edge")
        .forEach(edge => {
            edge.classList.remove("active-edge");
        });

}


/* ================= FINAL PATH ================= */

function highlightFinalPath(path) {

    for (let i = 0; i < path.length; i++) {

        const node = getNodeElement(path[i]);

        if (node) {
            node.classList.add("path-node");
        }

    }


    for (let i = 0; i < path.length - 1; i++) {

        const key = getEdgeKey(
            path[i],
            path[i + 1]
        );

        const edge = getEdgeElement(key);

        if (edge) {

            edge.classList.add("final-path");

            edge.classList.add("animate-path");

        }

    }

}


/* ================= BLOCKED ROADS ================= */

function isBlocked(a, b) {

    return blockedEdges.has(
        getEdgeKey(a, b)
    );

}


/* ================= DIJKSTRA ================= */

function dijkstra(start, destination) {

    const distances = {};
    const previous = {};
    const visited = new Set();

    const steps = [];

    let roadsChecked = 0;


    Object.keys(graph).forEach(node => {

        distances[node] = Infinity;

        previous[node] = null;

    });


    distances[start] = 0;


    while (visited.size < Object.keys(graph).length) {

        let current = null;

        let smallestDistance = Infinity;


        Object.keys(graph).forEach(node => {

            if (
                !visited.has(node) &&
                distances[node] < smallestDistance
            ) {

                smallestDistance = distances[node];

                current = node;

            }

        });


        if (current === null) {
            break;
        }


        visited.add(current);


        steps.push({
            type: "visit",
            node: current,
            distance: distances[current]
        });


        if (current === destination) {
            break;
        }


        Object.keys(graph[current]).forEach(neighbor => {

            roadsChecked++;


            if (isBlocked(current, neighbor)) {

                steps.push({
                    type: "blocked",
                    from: current,
                    to: neighbor
                });

                return;
            }


            const weight =
                getEffectiveWeight(
                    current,
                    neighbor
                );


            const newDistance =
                distances[current] + weight;


            steps.push({
                type: "edge",
                from: current,
                to: neighbor,
                weight: weight
            });


            if (
                newDistance <
                distances[neighbor]
            ) {

                distances[neighbor] = newDistance;

                previous[neighbor] = current;


                steps.push({
                    type: "update",
                    node: neighbor,
                    distance: newDistance,
                    previous: current
                });

            }

        });

    }


    const path = [];

    let current = destination;


    if (
        distances[destination] === Infinity
    ) {

        return {
            path: [],
            distance: Infinity,
            visitedCount: visited.size,
            roadsChecked,
            steps
        };

    }


    while (current !== null) {

        path.unshift(current);

        current = previous[current];

    }


    return {
        path,
        distance: distances[destination],
        visitedCount: visited.size,
        roadsChecked,
        steps
    };

}


/* ================= ANIMATION ================= */

function sleep(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );

}


async function animateDijkstra(
    start,
    destination
) {

    if (isRunning) return;

    isRunning = true;


    clearGraphStyles();

    setStartNode(start);
    setDestinationNode(destination);


    const result =
        dijkstra(start, destination);


    const stepsPanel =
        document.getElementById("stepsPanel");

    if (stepsPanel) {
        stepsPanel.classList.remove("hidden");
    }


    const stepsContainer =
        document.getElementById("stepsContainer");

    if (stepsContainer) {
        stepsContainer.innerHTML = "";
    }


    let stepNumber = 1;


    for (const step of result.steps) {

        if (step.type === "visit") {

            setCurrentNode(step.node);

            await sleep(350);

            setVisitedNode(step.node);


            createStepCard(
                stepNumber++,
                `Visiting ${step.node}`,
                `Current shortest distance = ${formatNumber(step.distance)}`
            );

        }


        else if (step.type === "edge") {

            clearActiveEdges();

            setActiveEdge(
                step.from,
                step.to
            );

            await sleep(100);

        }


        else if (step.type === "update") {

            setUpdatedEdge(
                step.previous,
                step.node
            );


            createStepCard(
                stepNumber++,
                `Distance Updated: ${step.node}`,
                `New distance = ${formatNumber(step.distance)}`
            );

        }


        else if (step.type === "blocked") {

            createStepCard(
                stepNumber++,
                "Blocked Road",
                `${step.from} → ${step.to} was ignored.`
            );

        }

    }


    clearActiveEdges();


    if (result.path.length > 0) {

        highlightFinalPath(result.path);

        displayResult(
            start,
            destination,
            result
        );

    }

    else {

        displayNoRoute();

    }


    updateStatistics(result);


    isRunning = false;

}


/* ================= FORMAT NUMBER ================= */

function formatNumber(number) {

    if (number % 1 === 0) {
        return number;
    }

    return number.toFixed(1);

}


/* ================= TIME ================= */

function calculateTime(distance) {

    const speed = 30;

    const hours = distance / speed;

    const minutes = hours * 60;

    if (minutes < 1) {
        return "< 1 min";
    }

    return `${Math.round(minutes)} min`;

}


/* ================= ROUTE DISPLAY ================= */

function formatPath(path) {

    return path.join(" → ");

}


function displayResult(
    start,
    destination,
    result
) {

    const routeResult =
        document.getElementById("routeResult");

    const distance =
        formatNumber(result.distance);

    const time =
        calculateTime(result.distance);


    routeResult.innerHTML = `

        <div class="route-path">
            ${formatPath(result.path)}
        </div>

        <div class="route-distance">
            Distance: <strong>${distance} km</strong>
        </div>

        <div class="route-distance">
            Estimated Time: <strong>${time}</strong>
        </div>

    `;


    const graphMessage =
        document.getElementById("graphMessage");

    if (graphMessage) {

        graphMessage.textContent =
            `${start} → ${destination} • ${distance} km`;

    }

}


function displayNoRoute() {

    const routeResult =
        document.getElementById("routeResult");

    routeResult.innerHTML = `

        <div class="result-placeholder">
            No route available between the selected locations.
        </div>

    `;


    const graphMessage =
        document.getElementById("graphMessage");

    if (graphMessage) {

        graphMessage.textContent =
            "No route available.";

    }

}


/* ================= STATISTICS ================= */

function resetStatistics() {

    document.getElementById("nodesVisited")
        .textContent = "0";

    document.getElementById("roadsChecked")
        .textContent = "0";

    document.getElementById("pathNodes")
        .textContent = "0";

    document.getElementById("totalWeight")
        .textContent = "0 km";

}


function updateStatistics(result) {

    document.getElementById("nodesVisited")
        .textContent =
        result.visitedCount;


    document.getElementById("roadsChecked")
        .textContent =
        result.roadsChecked;


    document.getElementById("pathNodes")
        .textContent =
        result.path.length;


    document.getElementById("totalWeight")
        .textContent =
        result.distance === Infinity
            ? "∞"
            : `${formatNumber(result.distance)} km`;

}


/* ================= STEP CARD ================= */

function createStepCard(
    number,
    title,
    description
) {

    const container =
        document.getElementById("stepsContainer");

    if (!container) return;


    const card =
        document.createElement("div");

    card.className = "step-card";


    card.innerHTML = `

        <h4>
            Step ${number}: ${title}
        </h4>

        <p>
            ${description}
        </p>

    `;


    container.appendChild(card);

}


/* ================= ROAD STATUS ================= */

function updateRoadStatus() {

    const status =
        document.getElementById("roadStatus");

    if (!status) return;


    if (blockedEdges.size === 0) {

        status.textContent =
            "No roads blocked.";

        status.classList.remove("active");

        return;

    }


    status.classList.add("active");


    status.textContent =
        `${blockedEdges.size} road(s) currently blocked.`;

}


/* ================= APPLY BLOCKED STYLES ================= */

function applyBlockedStyles() {

    document.querySelectorAll(".edge")
        .forEach(edge => {

            edge.classList.remove(
                "blocked-edge"
            );

        });


    blockedEdges.forEach(key => {

        const edge =
            getEdgeElement(key);

        if (edge) {

            edge.classList.add(
                "blocked-edge"
            );

        }

    });


    updateRoadStatus();

}


/* ================= ROAD SELECTION ================= */

function populateBlockRoads() {

    const select =
        document.getElementById("blockRoad");

    if (!select) return;


    select.innerHTML = `
        <option value="">
            Select a road
        </option>
    `;


    Object.keys(roadWeights).forEach(key => {

        const option =
            document.createElement("option");

        option.value = key;

        option.textContent =
            `${key.replace("-", " → ")} (${formatNumber(roadWeights[key])} km)`;

        select.appendChild(option);

    });

}


function blockSelectedRoad() {

    const select =
        document.getElementById("blockRoad");

    const key = select.value;


    if (!key) {

        alert("Please select a road.");

        return;

    }


    blockedEdges.add(key);

    applyBlockedStyles();

    select.value = "";


    clearGraphStyles();

    applyBlockedStyles();

}


/* ================= CLEAR BLOCKED ================= */

function clearBlockedRoads() {

    blockedEdges.clear();

    applyBlockedStyles();

}


/* ================= TRAFFIC SYSTEM ================= */

function initializeRoadSettings() {

    const select =
        document.getElementById("roadSelect");

    if (!select) return;


    select.innerHTML = `
        <option value="">
            Select a road
        </option>
    `;


    Object.keys(roadWeights).forEach(key => {

        const option =
            document.createElement("option");

        option.value = key;

        option.textContent =
            `${key.replace("-", " → ")} (${formatNumber(roadWeights[key])} km)`;

        select.appendChild(option);

    });


    updateAllRoadLabels();

}


function updateRoadLabel(key) {

    const edge =
        getEdgeElement(key);

    if (!edge) return;


    const text =
        edge.querySelector("text");

    if (!text) return;


    const effective =
        getEffectiveWeight(
            ...key.split("-")
        );


    text.textContent =
        formatNumber(effective);


    edge.classList.remove(
        "traffic-low",
        "traffic-medium",
        "traffic-heavy"
    );


    const traffic =
        trafficLevels[key];


    edge.classList.add(
        `traffic-${traffic}`
    );

}


function updateAllRoadLabels() {

    Object.keys(roadWeights)
        .forEach(key => {

            updateRoadLabel(key);

        });

}


function getTrafficText(level) {

    if (level === "low") {
        return "🟢 Low Traffic ×1";
    }

    if (level === "medium") {
        return "🟡 Medium Traffic ×1.5";
    }

    return "🔴 Heavy Traffic ×2";

}


function updateRoadInfo() {

    const select =
        document.getElementById("roadSelect");

    const info =
        document.getElementById("roadInfo");


    if (!select || !info) return;


    const key = select.value;


    if (!key) {

        info.textContent =
            "Select a road to modify its weight and traffic.";

        return;

    }


    const [from, to] =
        key.split("-");


    const base =
        roadWeights[key];


    const traffic =
        trafficLevels[key];


    const effective =
        getEffectiveWeight(
            from,
            to
        );


    info.innerHTML = `

        <strong>
            ${from} → ${to}
        </strong>

        <br>

        Base Weight:
        ${formatNumber(base)} km

        <br>

        Traffic:
        ${getTrafficText(traffic)}

        <br>

        Effective Weight:
        <strong>
            ${formatNumber(effective)} km
        </strong>

    `;

}


function selectRoadForSettings(key) {

    const select =
        document.getElementById("roadSelect");


    if (!select) return;


    select.value = key;


    document.getElementById("roadWeight")
        .value =
        roadWeights[key];


    document.getElementById("trafficLevel")
        .value =
        trafficLevels[key];


    document.querySelectorAll(".edge")
        .forEach(edge => {

            edge.classList.remove(
                "selected-road"
            );

        });


    const edge =
        getEdgeElement(key);


    if (edge) {

        edge.classList.add(
            "selected-road"
        );

    }


    updateRoadInfo();

}


function applyRoadSettings() {

    const select =
        document.getElementById("roadSelect");


    const key =
        select.value;


    if (!key) {

        alert("Please select a road first.");

        return;

    }


    const weight =
        parseFloat(
            document.getElementById(
                "roadWeight"
            ).value
        );


    const traffic =
        document.getElementById(
            "trafficLevel"
        ).value;


    if (
        isNaN(weight) ||
        weight <= 0
    ) {

        alert(
            "Please enter a valid road weight."
        );

        return;

    }


    roadWeights[key] = weight;

    trafficLevels[key] = traffic;


    updateRoadLabel(key);

    updateRoadInfo();


    populateBlockRoads();


    const source =
        document.getElementById(
            "source"
        ).value;


    const destination =
        document.getElementById(
            "destination"
        ).value;


    clearGraphStyles();

    setStartNode(source);

    setDestinationNode(destination);

    applyBlockedStyles();


    alert(
        "Road settings updated successfully!"
    );

}


/* ================= DEMO ================= */

async function runDemo() {

    if (isRunning) return;


    document.getElementById("source")
        .value = "A";


    document.getElementById("destination")
        .value = "T";


    blockedEdges.clear();

    applyBlockedStyles();


    await animateDijkstra(
        "A",
        "T"
    );

}


/* ================= RESET ================= */

function resetRoute() {

    if (isRunning) return;


    clearGraphStyles();


    const source =
        document.getElementById("source")
            .value;


    const destination =
        document.getElementById("destination")
            .value;


    setStartNode(source);

    setDestinationNode(destination);


    const routeResult =
        document.getElementById(
            "routeResult"
        );


    routeResult.innerHTML = `

        <div class="result-placeholder">
            Select locations and find a route.
        </div>

    `;


    const graphMessage =
        document.getElementById(
            "graphMessage"
        );


    if (graphMessage) {

        graphMessage.textContent =
            "Select source and destination to find the shortest route.";

    }


    resetStatistics();


    const stepsPanel =
        document.getElementById(
            "stepsPanel"
        );


    if (stepsPanel) {

        stepsPanel.classList.add(
            "hidden"
        );

    }


    const stepsContainer =
        document.getElementById(
            "stepsContainer"
        );


    if (stepsContainer) {

        stepsContainer.innerHTML = "";

    }


    applyBlockedStyles();


    document.querySelectorAll(".edge")
        .forEach(edge => {

            edge.classList.remove(
                "selected-road"
            );

        });

}


/* ================= NODE CLICK ================= */

function enableNodeClick() {

    document.querySelectorAll(".node")
        .forEach(node => {

            node.addEventListener(
                "click",
                function () {

                    const nodeName =
                        this.dataset.node;


                    document.getElementById(
                        "source"
                    ).value =
                        nodeName;


                    clearGraphStyles();


                    setStartNode(
                        nodeName
                    );


                    setDestinationNode(
                        document.getElementById(
                            "destination"
                        ).value
                    );

                }
            );

        });

}


/* ================= EVENTS ================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        initializeRoadSettings();

        populateBlockRoads();

        updateAllRoadLabels();


        const findRoute =
            document.getElementById(
                "findRoute"
            );


        if (findRoute) {

            findRoute.addEventListener(
                "click",
                function () {

                    const source =
                        document.getElementById(
                            "source"
                        ).value;


                    const destination =
                        document.getElementById(
                            "destination"
                        ).value;


                    if (
                        source ===
                        destination
                    ) {

                        alert(
                            "Starting point and destination cannot be the same."
                        );

                        return;

                    }


                    animateDijkstra(
                        source,
                        destination
                    );

                }
            );

        }


        const demoBtn =
            document.getElementById(
                "demoBtn"
            );


        if (demoBtn) {

            demoBtn.addEventListener(
                "click",
                runDemo
            );

        }


        const resetBtn =
            document.getElementById(
                "resetBtn"
            );


        if (resetBtn) {

            resetBtn.addEventListener(
                "click",
                resetRoute
            );

        }


        const blockBtn =
            document.getElementById(
                "blockRoadBtn"
            );


        if (blockBtn) {

            blockBtn.addEventListener(
                "click",
                blockSelectedRoad
            );

        }


        const clearBlockedBtn =
            document.getElementById(
                "clearBlockedBtn"
            );


        if (clearBlockedBtn) {

            clearBlockedBtn.addEventListener(
                "click",
                clearBlockedRoads
            );

        }


        const roadSelect =
            document.getElementById(
                "roadSelect"
            );


        if (roadSelect) {

            roadSelect.addEventListener(
                "change",
                function () {

                    const key =
                        this.value;


                    if (key) {

                        selectRoadForSettings(
                            key
                        );

                    }

                    else {

                        document.querySelectorAll(
                            ".edge"
                        ).forEach(edge => {

                            edge.classList.remove(
                                "selected-road"
                            );

                        });


                        updateRoadInfo();

                    }

                }
            );

        }


        const trafficLevel =
            document.getElementById(
                "trafficLevel"
            );


        if (trafficLevel) {

            trafficLevel.addEventListener(
                "change",
                updateRoadInfo
            );

        }


        const roadWeight =
            document.getElementById(
                "roadWeight"
            );


        if (roadWeight) {

            roadWeight.addEventListener(
                "input",
                updateRoadInfo
            );

        }


        const applySettings =
            document.getElementById(
                "applyRoadSettings"
            );


        if (applySettings) {

            applySettings.addEventListener(
                "click",
                applyRoadSettings
            );

        }


        const showStepsBtn =
            document.getElementById(
                "showStepsBtn"
            );


        if (showStepsBtn) {

            showStepsBtn.addEventListener(
                "click",
                function () {

                    const panel =
                        document.getElementById(
                            "stepsPanel"
                        );


                    panel.classList.toggle(
                        "hidden"
                    );

                }
            );

        }


        const aboutBtn =
            document.getElementById(
                "aboutBtn"
            );


        if (aboutBtn) {

            aboutBtn.addEventListener(
                "click",
                function () {

                    const panel =
                        document.getElementById(
                            "infoPanel"
                        );


                    panel.classList.toggle(
                        "hidden"
                    );

                }
            );

        }


        document.getElementById(
            "source"
        ).addEventListener(
            "change",
            function () {

                if (!isRunning) {

                    clearGraphStyles();

                    setStartNode(
                        this.value
                    );

                    setDestinationNode(
                        document.getElementById(
                            "destination"
                        ).value
                    );

                    applyBlockedStyles();

                }

            }
        );


        document.getElementById(
            "destination"
        ).addEventListener(
            "change",
            function () {

                if (!isRunning) {

                    clearGraphStyles();

                    setStartNode(
                        document.getElementById(
                            "source"
                        ).value
                    );

                    setDestinationNode(
                        this.value
                    );

                    applyBlockedStyles();

                }

            }
        );


        enableNodeClick();


        const initialSource =
            document.getElementById(
                "source"
            ).value;


        const initialDestination =
            document.getElementById(
                "destination"
            ).value;


        setStartNode(
            initialSource
        );

        setDestinationNode(
            initialDestination
        );


        applyBlockedStyles();

    }
);