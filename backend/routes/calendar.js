/**
 * Calendar API Routes
 * Handles calendar events, scheduling, and deadlines
 */

const express = require('express');
const router = express.Router();
const CalendarService = require('../services/calendar-service');

const calendarService = new CalendarService();

// ============================================================================
// CALENDAR EVENTS
// ============================================================================

// Create event
router.post('/events', (req, res) => {
  try {
    const { organizer_id = 1 } = req.body; // TODO: Get from session
    const event = calendarService.createEvent(req.body, organizer_id);
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific event
router.get('/events/:id', (req, res) => {
  try {
    const event = calendarService.getEvent(parseInt(req.params.id));
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get events in date range
router.get('/events', (req, res) => {
  try {
    const { start_date, end_date, user_id } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required'
      });
    }

    const events = calendarService.getEventsInRange(
      start_date,
      end_date,
      user_id ? parseInt(user_id) : null
    );

    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's events
router.get('/users/:userId/events', (req, res) => {
  try {
    const { status } = req.query;
    const events = calendarService.getUserEvents(parseInt(req.params.userId), status);
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update attendee status
router.post('/events/:eventId/attendees/:userId', (req, res) => {
  try {
    const { status } = req.body;
    calendarService.updateAttendeeStatus(
      parseInt(req.params.eventId),
      parseInt(req.params.userId),
      status
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get upcoming deadlines
router.get('/deadlines', (req, res) => {
  try {
    const { days_ahead = 7, user_id } = req.query;
    const deadlines = calendarService.getUpcomingDeadlines(
      parseInt(days_ahead),
      user_id ? parseInt(user_id) : null
    );
    res.json({ success: true, deadlines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CONTENT SCHEDULING
// ============================================================================

// Schedule content
router.post('/schedule', (req, res) => {
  try {
    const { scheduled_by = 1 } = req.body; // TODO: Get from session
    const scheduled = calendarService.scheduleContent(req.body, scheduled_by);
    res.json({ success: true, scheduled });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scheduled content
router.get('/schedule/:id', (req, res) => {
  try {
    const scheduled = calendarService.getScheduledContent(parseInt(req.params.id));
    if (!scheduled) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    res.json({ success: true, scheduled });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scheduled content by date
router.get('/schedule', (req, res) => {
  try {
    const { start_date, end_date, channel } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required'
      });
    }

    const scheduled = calendarService.getScheduledContentByDate(start_date, end_date, channel);
    res.json({ success: true, scheduled });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark content as published
router.post('/schedule/:id/publish', (req, res) => {
  try {
    const { published_by = 1 } = req.body; // TODO: Get from session
    calendarService.markContentPublished(parseInt(req.params.id), published_by);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel scheduled content
router.post('/schedule/:id/cancel', (req, res) => {
  try {
    const { reason } = req.body;
    calendarService.cancelScheduledContent(parseInt(req.params.id), reason);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// STATISTICS
// ============================================================================

// Get calendar statistics
router.get('/stats', (req, res) => {
  try {
    const { user_id, days_ahead = 30 } = req.query;
    const stats = calendarService.getCalendarStats(
      user_id ? parseInt(user_id) : null,
      parseInt(days_ahead)
    );
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
