const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const TONE_SETTINGS_PATH = path.join(__dirname, '../config/tone-settings.json');

// Get current tone settings
router.get('/tone-settings', (req, res) => {
    try {
        const settings = JSON.parse(fs.readFileSync(TONE_SETTINGS_PATH, 'utf8'));
        res.json({
            success: true,
            settings: settings
        });
    } catch (error) {
        console.error('Error loading tone settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load tone settings',
            details: error.message
        });
    }
});

// Get campaign's active tone configuration
router.get('/tone-settings/active', (req, res) => {
    try {
        const settings = JSON.parse(fs.readFileSync(TONE_SETTINGS_PATH, 'utf8'));

        // If campaign tone is enabled, return it; otherwise return default
        const activeTone = settings.campaignTone.enabled
            ? settings.campaignTone
            : settings.defaultTone;

        res.json({
            success: true,
            isCustom: settings.campaignTone.enabled,
            tone: activeTone,
            availableProfiles: settings.campaignTone.toneProfiles
        });
    } catch (error) {
        console.error('Error loading active tone:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load active tone settings',
            details: error.message
        });
    }
});

// Get available tone profiles
router.get('/tone-settings/profiles', (req, res) => {
    try {
        const settings = JSON.parse(fs.readFileSync(TONE_SETTINGS_PATH, 'utf8'));
        res.json({
            success: true,
            profiles: settings.campaignTone.toneProfiles,
            dimensions: settings.toneDimensions
        });
    } catch (error) {
        console.error('Error loading tone profiles:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load tone profiles',
            details: error.message
        });
    }
});

// Update campaign tone settings
router.post('/tone-settings', (req, res) => {
    try {
        const {
            enabled,
            candidate,
            useProfile,
            contentTypes
        } = req.body;

        // Load current settings
        const settings = JSON.parse(fs.readFileSync(TONE_SETTINGS_PATH, 'utf8'));

        // Update campaign tone
        if (enabled !== undefined) {
            settings.campaignTone.enabled = enabled;
        }

        if (candidate) {
            settings.campaignTone.candidate = {
                ...settings.campaignTone.candidate,
                ...candidate
            };
        }

        if (useProfile) {
            settings.campaignTone.useProfile = useProfile;
        }

        if (contentTypes) {
            settings.campaignTone.contentTypes = {
                ...settings.campaignTone.contentTypes,
                ...contentTypes
            };
        }

        // Save updated settings
        fs.writeFileSync(
            TONE_SETTINGS_PATH,
            JSON.stringify(settings, null, 2),
            'utf8'
        );

        res.json({
            success: true,
            message: 'Tone settings updated successfully',
            settings: settings.campaignTone
        });

    } catch (error) {
        console.error('Error updating tone settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update tone settings',
            details: error.message
        });
    }
});

// Apply a tone profile to campaign settings
router.post('/tone-settings/apply-profile', (req, res) => {
    try {
        const { profileName } = req.body;

        if (!profileName) {
            return res.status(400).json({
                success: false,
                error: 'Profile name is required'
            });
        }

        // Load current settings
        const settings = JSON.parse(fs.readFileSync(TONE_SETTINGS_PATH, 'utf8'));

        // Check if profile exists
        const profile = settings.campaignTone.toneProfiles[profileName];
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: `Tone profile '${profileName}' not found`,
                availableProfiles: Object.keys(settings.campaignTone.toneProfiles)
            });
        }

        // Apply profile
        settings.campaignTone.enabled = true;
        settings.campaignTone.useProfile = profileName;

        // Apply profile tone to default content types
        Object.keys(settings.campaignTone.contentTypes).forEach(contentType => {
            Object.keys(settings.campaignTone.contentTypes[contentType]).forEach(scenario => {
                settings.campaignTone.contentTypes[contentType][scenario] = {
                    ...settings.campaignTone.contentTypes[contentType][scenario],
                    emotional: profile.emotional,
                    rhetorical: profile.rhetorical,
                    urgency: profile.urgency
                };
            });
        });

        // Save updated settings
        fs.writeFileSync(
            TONE_SETTINGS_PATH,
            JSON.stringify(settings, null, 2),
            'utf8'
        );

        res.json({
            success: true,
            message: `Applied '${profileName}' tone profile`,
            profile: profile,
            settings: settings.campaignTone
        });

    } catch (error) {
        console.error('Error applying tone profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to apply tone profile',
            details: error.message
        });
    }
});

// Reset to default tone settings
router.post('/tone-settings/reset', (req, res) => {
    try {
        const settings = JSON.parse(fs.readFileSync(TONE_SETTINGS_PATH, 'utf8'));

        settings.campaignTone.enabled = false;

        fs.writeFileSync(
            TONE_SETTINGS_PATH,
            JSON.stringify(settings, null, 2),
            'utf8'
        );

        res.json({
            success: true,
            message: 'Reset to default tone settings',
            settings: settings.defaultTone
        });

    } catch (error) {
        console.error('Error resetting tone settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset tone settings',
            details: error.message
        });
    }
});

module.exports = router;
