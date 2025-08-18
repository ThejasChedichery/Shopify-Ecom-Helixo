import Timer from "../Model/TimerModel.js";


// Create a new timer
export const createTimer = async (req, res) => {
    try {
        const { shopDomain, startDate, endDate, description, displayOptions, urgencySettings } = req.body;

        const timer = new Timer({
            shopDomain,
            startDate,
            endDate,
            description,
            displayOptions,
            urgencySettings
        });

        await timer.save();
        res.status(201).json({ success: true, timer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all timers for a store
export const getTimers = async (req, res) => {
    try {
        const { shopDomain } = req.query;
        const shop = req.query.shop || req.query.shopDomain
        if (!shop) {
            return res.status(400).send({ error: "Missing shop parameter" });
        }
        const timers = await Timer.find();
        res.status(200).json({ success: true, timers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a timer
export const updateTimer = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, description, displayOptions, urgencySettings } = req.body;

        const timer = await Timer.findByIdAndUpdate(
            id,
            { startDate, endDate, description, displayOptions, urgencySettings },
            { new: true } // return the updated document
        );

        if (!timer) {
            return res.status(404).json({ success: false, message: "Timer not found" });
        }

        res.status(200).json({ success: true, timer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Delete a timer
export const deleteTimer = async (req, res) => {
    try {
        const { id } = req.params;
        await Timer.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Timer deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

