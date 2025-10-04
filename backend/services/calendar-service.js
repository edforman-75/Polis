/**
 * Calendar Service
 * Manages content calendar, scheduling, and deadline tracking
 */

const Database = require('better-sqlite3');
const path = require('path');

class CalendarService {
  constructor() {
    const dbPath = path.join(__dirname, '../data/workflow.db');
    this.db = new Database(dbPath);
  }

  // ========================================================================
  // CALENDAR EVENTS
  // ========================================================================

  createEvent(eventData, organizerId) {
    const {
      title,
      description,
      event_type,
      content_id,
      content_type,
      start_datetime,
      end_datetime,
      all_day,
      location,
      priority,
      metadata,
      attendees
    } = eventData;

    const insert = this.db.prepare(`
      INSERT INTO calendar_events
      (title, description, event_type, content_id, content_type, start_datetime, end_datetime,
       all_day, location, organizer_id, priority, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      title,
      description || null,
      event_type,
      content_id || null,
      content_type || null,
      start_datetime,
      end_datetime || null,
      all_day || 0,
      location || null,
      organizerId,
      priority || 'medium',
      metadata ? JSON.stringify(metadata) : null
    );

    const eventId = result.lastInsertRowid;

    // Add attendees if provided
    if (attendees && attendees.length > 0) {
      this.addAttendees(eventId, attendees);
    }

    return this.getEvent(eventId);
  }

  getEvent(eventId) {
    const event = this.db.prepare(`
      SELECT ce.*, u.full_name as organizer_name, u.email as organizer_email
      FROM calendar_events ce
      JOIN users u ON ce.organizer_id = u.id
      WHERE ce.id = ?
    `).get(eventId);

    if (!event) return null;

    // Get attendees
    event.attendees = this.db.prepare(`
      SELECT ca.*, u.full_name, u.email, u.role
      FROM calendar_attendees ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.event_id = ?
    `).all(eventId);

    // Parse metadata
    if (event.metadata) {
      try {
        event.metadata = JSON.parse(event.metadata);
      } catch (e) {
        event.metadata = null;
      }
    }

    return event;
  }

  addAttendees(eventId, attendees) {
    const insert = this.db.prepare(`
      INSERT INTO calendar_attendees (event_id, user_id, role)
      VALUES (?, ?, ?)
    `);

    attendees.forEach(attendee => {
      insert.run(
        eventId,
        attendee.user_id,
        attendee.role || 'attendee'
      );
    });
  }

  updateAttendeeStatus(eventId, userId, status) {
    const update = this.db.prepare(`
      UPDATE calendar_attendees
      SET status = ?, responded_at = CURRENT_TIMESTAMP
      WHERE event_id = ? AND user_id = ?
    `);

    return update.run(status, eventId, userId);
  }

  getEventsInRange(startDate, endDate, userId = null) {
    let query = `
      SELECT ce.*, u.full_name as organizer_name
      FROM calendar_events ce
      JOIN users u ON ce.organizer_id = u.id
      WHERE ce.start_datetime >= ? AND ce.start_datetime <= ?
    `;

    const params = [startDate, endDate];

    if (userId) {
      query += `
        AND (ce.organizer_id = ? OR EXISTS (
          SELECT 1 FROM calendar_attendees ca
          WHERE ca.event_id = ce.id AND ca.user_id = ?
        ))
      `;
      params.push(userId, userId);
    }

    query += ' ORDER BY ce.start_datetime';

    return this.db.prepare(query).all(...params);
  }

  getUserEvents(userId, status = null) {
    let query = `
      SELECT ce.*, u.full_name as organizer_name, ca.role as user_role, ca.status as rsvp_status
      FROM calendar_events ce
      JOIN users u ON ce.organizer_id = u.id
      LEFT JOIN calendar_attendees ca ON ce.id = ca.event_id AND ca.user_id = ?
      WHERE ce.organizer_id = ? OR ca.user_id = ?
    `;

    const params = [userId, userId, userId];

    if (status) {
      query += ' AND ce.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ce.start_datetime DESC';

    return this.db.prepare(query).all(...params);
  }

  getUpcomingDeadlines(daysAhead = 7, userId = null) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const query = userId
      ? `
        SELECT ce.*, u.full_name as organizer_name
        FROM calendar_events ce
        JOIN users u ON ce.organizer_id = u.id
        WHERE ce.event_type IN ('content_deadline', 'approval_deadline')
          AND ce.start_datetime <= ?
          AND ce.status IN ('scheduled', 'in_progress')
          AND (ce.organizer_id = ? OR EXISTS (
            SELECT 1 FROM calendar_attendees ca
            WHERE ca.event_id = ce.id AND ca.user_id = ?
          ))
        ORDER BY ce.start_datetime
      `
      : `
        SELECT ce.*, u.full_name as organizer_name
        FROM calendar_events ce
        JOIN users u ON ce.organizer_id = u.id
        WHERE ce.event_type IN ('content_deadline', 'approval_deadline')
          AND ce.start_datetime <= ?
          AND ce.status IN ('scheduled', 'in_progress')
        ORDER BY ce.start_datetime
      `;

    const params = userId
      ? [endDate.toISOString(), userId, userId]
      : [endDate.toISOString()];

    return this.db.prepare(query).all(...params);
  }

  // ========================================================================
  // CONTENT SCHEDULING
  // ========================================================================

  scheduleContent(scheduleData, scheduledBy) {
    const { content_id, content_type, scheduled_for, publish_channel, metadata } = scheduleData;

    const insert = this.db.prepare(`
      INSERT INTO content_schedule
      (content_id, content_type, scheduled_for, scheduled_by, publish_channel, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      content_id,
      content_type,
      scheduled_for,
      scheduledBy,
      publish_channel || null,
      metadata ? JSON.stringify(metadata) : null
    );

    return this.getScheduledContent(result.lastInsertRowid);
  }

  getScheduledContent(scheduleId) {
    const scheduled = this.db.prepare(`
      SELECT cs.*, u1.full_name as scheduled_by_name, u2.full_name as published_by_name
      FROM content_schedule cs
      JOIN users u1 ON cs.scheduled_by = u1.id
      LEFT JOIN users u2 ON cs.published_by = u2.id
      WHERE cs.id = ?
    `).get(scheduleId);

    if (scheduled && scheduled.metadata) {
      try {
        scheduled.metadata = JSON.parse(scheduled.metadata);
      } catch (e) {
        scheduled.metadata = null;
      }
    }

    return scheduled;
  }

  getScheduledContentByDate(startDate, endDate, channel = null) {
    let query = `
      SELECT cs.*, u.full_name as scheduled_by_name
      FROM content_schedule cs
      JOIN users u ON cs.scheduled_by = u.id
      WHERE cs.scheduled_for >= ? AND cs.scheduled_for <= ?
        AND cs.status = 'scheduled'
    `;

    const params = [startDate, endDate];

    if (channel) {
      query += ' AND cs.publish_channel = ?';
      params.push(channel);
    }

    query += ' ORDER BY cs.scheduled_for';

    return this.db.prepare(query).all(...params);
  }

  markContentPublished(scheduleId, publishedBy) {
    const update = this.db.prepare(`
      UPDATE content_schedule
      SET status = 'published',
          published_at = CURRENT_TIMESTAMP,
          published_by = ?
      WHERE id = ?
    `);

    return update.run(publishedBy, scheduleId);
  }

  cancelScheduledContent(scheduleId, reason) {
    const update = this.db.prepare(`
      UPDATE content_schedule
      SET status = 'cancelled',
          cancellation_reason = ?
      WHERE id = ?
    `);

    return update.run(reason, scheduleId);
  }

  // ========================================================================
  // CALENDAR STATISTICS
  // ========================================================================

  getCalendarStats(userId = null, daysAhead = 30) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const stats = {
      upcoming_events: 0,
      pending_deadlines: 0,
      scheduled_content: 0,
      overdue_tasks: 0
    };

    // Upcoming events
    const eventsQuery = userId
      ? `
        SELECT COUNT(*) as count FROM calendar_events
        WHERE start_datetime <= ? AND status = 'scheduled'
          AND (organizer_id = ? OR EXISTS (
            SELECT 1 FROM calendar_attendees WHERE event_id = calendar_events.id AND user_id = ?
          ))
      `
      : 'SELECT COUNT(*) as count FROM calendar_events WHERE start_datetime <= ? AND status = "scheduled"';

    const eventsParams = userId ? [endDate.toISOString(), userId, userId] : [endDate.toISOString()];
    stats.upcoming_events = this.db.prepare(eventsQuery).get(...eventsParams).count;

    // Pending deadlines
    const deadlinesQuery = userId
      ? `
        SELECT COUNT(*) as count FROM calendar_events
        WHERE event_type IN ('content_deadline', 'approval_deadline')
          AND start_datetime <= ? AND status IN ('scheduled', 'in_progress')
          AND (organizer_id = ? OR EXISTS (
            SELECT 1 FROM calendar_attendees WHERE event_id = calendar_events.id AND user_id = ?
          ))
      `
      : `
        SELECT COUNT(*) as count FROM calendar_events
        WHERE event_type IN ('content_deadline', 'approval_deadline')
          AND start_datetime <= ? AND status IN ('scheduled', 'in_progress')
      `;

    stats.pending_deadlines = this.db.prepare(deadlinesQuery).get(...eventsParams).count;

    // Scheduled content
    stats.scheduled_content = this.db.prepare(`
      SELECT COUNT(*) as count FROM content_schedule
      WHERE scheduled_for <= ? AND status = 'scheduled'
    `).get(endDate.toISOString()).count;

    return stats;
  }
}

module.exports = CalendarService;
