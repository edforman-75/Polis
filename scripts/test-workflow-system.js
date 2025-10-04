/**
 * Test Workflow & Collaboration System
 * Tests all workflow, calendar, collaboration, and version control features
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testWorkflowSystem() {
  console.log('\n🧪 Testing Workflow & Collaboration System\n');
  console.log('='.repeat(80) + '\n');

  let testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // ========================================================================
    // TEST 1: User Management
    // ========================================================================
    console.log('1️⃣  Testing User Management...');

    const usersResponse = await fetch(`${BASE_URL}/api/workflow/users`);
    const usersData = await usersResponse.json();

    if (usersData.success && usersData.users.length > 0) {
      console.log(`   ✓ Users loaded: ${usersData.users.length} users found`);
      testResults.passed++;
    } else {
      console.log('   ✗ Failed to load users');
      testResults.failed++;
    }

    // ========================================================================
    // TEST 2: Workflow Template
    // ========================================================================
    console.log('\n2️⃣  Testing Workflow Templates...');

    const templatesResponse = await fetch(`${BASE_URL}/api/workflow/templates`);
    const templatesData = await templatesResponse.json();

    if (templatesData.success) {
      console.log(`   ✓ Templates loaded: ${templatesData.templates.length} templates`);
      testResults.passed++;
    } else {
      console.log('   ✗ Failed to load templates');
      testResults.failed++;
    }

    // ========================================================================
    // TEST 3: Start Workflow
    // ========================================================================
    console.log('\n3️⃣  Testing Workflow Creation...');

    const workflowData = {
      template_id: 1,
      content_id: 1,
      content_type: 'press_release',
      priority: 'high',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      initiated_by: 1
    };

    const createWorkflowResponse = await fetch(`${BASE_URL}/api/workflow/instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflowData)
    });

    const workflowInstance = await createWorkflowResponse.json();

    if (workflowInstance.success && workflowInstance.instance) {
      console.log(`   ✓ Workflow created: Instance #${workflowInstance.instance.id}`);
      console.log(`   ✓ Current stage: ${workflowInstance.instance.current_stage?.stage_name}`);
      testResults.passed++;
    } else {
      console.log('   ✗ Failed to create workflow');
      testResults.failed++;
      testResults.errors.push('Workflow creation failed');
    }

    // ========================================================================
    // TEST 4: Calendar Events
    // ========================================================================
    console.log('\n4️⃣  Testing Calendar Events...');

    const eventData = {
      title: 'Press Release Review',
      description: 'Review healthcare policy press release',
      event_type: 'content_deadline',
      content_id: 1,
      content_type: 'press_release',
      start_datetime: new Date(Date.now() + 86400000).toISOString(),
      priority: 'high',
      organizer_id: 2,
      attendees: [
        { user_id: 3, role: 'required' },
        { user_id: 4, role: 'required' }
      ]
    };

    const createEventResponse = await fetch(`${BASE_URL}/api/calendar/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    const eventResult = await createEventResponse.json();

    if (eventResult.success && eventResult.event) {
      console.log(`   ✓ Calendar event created: ${eventResult.event.title}`);
      console.log(`   ✓ Attendees: ${eventResult.event.attendees.length}`);
      testResults.passed++;
    } else {
      console.log('   ✗ Failed to create calendar event');
      testResults.failed++;
    }

    // ========================================================================
    // TEST 5: Comments & Collaboration
    // ========================================================================
    console.log('\n5️⃣  Testing Comments & Collaboration...');

    const commentData = {
      content_id: 1,
      content_type: 'press_release',
      comment_text: 'This paragraph needs strengthening. @writer1 please revise.',
      comment_type: 'suggestion',
      author_id: 2
    };

    const createCommentResponse = await fetch(`${BASE_URL}/api/team-collaboration/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });

    const commentResult = await createCommentResponse.json();

    if (commentResult.success && commentResult.comment) {
      console.log(`   ✓ Comment created: "${commentResult.comment.comment_text.substring(0, 50)}..."`);
      if (commentResult.comment.mentions && commentResult.comment.mentions.length > 0) {
        console.log(`   ✓ Mentions detected: @${commentResult.comment.mentions[0].username}`);
      }
      testResults.passed++;
    } else {
      console.log('   ✗ Failed to create comment');
      testResults.failed++;
    }

    // ========================================================================
    // TEST 6: Version Control
    // ========================================================================
    console.log('\n6️⃣  Testing Version Control...');

    const versionData = {
      content_id: 1,
      content_type: 'press_release',
      title: 'Healthcare Policy Announcement',
      content: 'This is the first version of our healthcare policy press release. We propose affordable healthcare for all families.',
      change_summary: 'Initial version',
      is_major_version: 1,
      created_by: 3
    };

    const createVersionResponse = await fetch(`${BASE_URL}/api/version-control/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(versionData)
    });

    const versionResult = await createVersionResponse.json();

    if (versionResult.success && versionResult.version) {
      console.log(`   ✓ Version created: v${versionResult.version.version_number}`);

      // Create second version
      const version2Data = {
        ...versionData,
        content: 'This is the second version of our healthcare policy press release. We propose comprehensive, affordable healthcare for all families in Virginia.',
        change_summary: 'Added state specificity and strengthened language',
        is_major_version: 0
      };

      const version2Response = await fetch(`${BASE_URL}/api/version-control/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(version2Data)
      });

      const version2Result = await version2Response.json();

      if (version2Result.success) {
        console.log(`   ✓ Version 2 created: v${version2Result.version.version_number}`);

        // Compare versions
        const compareResponse = await fetch(`${BASE_URL}/api/version-control/versions/press_release/1/compare/1/2`);
        const compareResult = await compareResponse.json();

        if (compareResult.success) {
          console.log(`   ✓ Version comparison: ${compareResult.comparison.diff_data.stats.additions} additions, ${compareResult.comparison.diff_data.stats.deletions} deletions`);
          testResults.passed++;
        } else {
          console.log('   ✗ Failed to compare versions');
          testResults.failed++;
        }
      }
    } else {
      console.log('   ✗ Failed to create version');
      testResults.failed++;
    }

    // ========================================================================
    // TEST 7: Content Scheduling
    // ========================================================================
    console.log('\n7️⃣  Testing Content Scheduling...');

    const scheduleData = {
      content_id: 1,
      content_type: 'press_release',
      scheduled_for: new Date(Date.now() + 2 * 86400000).toISOString(),
      publish_channel: 'website',
      scheduled_by: 2,
      metadata: {
        auto_tweet: true,
        email_blast: true
      }
    };

    const scheduleResponse = await fetch(`${BASE_URL}/api/calendar/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });

    const scheduleResult = await scheduleResponse.json();

    if (scheduleResult.success && scheduleResult.scheduled) {
      console.log(`   ✓ Content scheduled for: ${new Date(scheduleResult.scheduled.scheduled_for).toLocaleDateString()}`);
      console.log(`   ✓ Channel: ${scheduleResult.scheduled.publish_channel}`);
      testResults.passed++;
    } else {
      console.log('   ✗ Failed to schedule content');
      testResults.failed++;
    }

    // ========================================================================
    // TEST 8: Activity Logging
    // ========================================================================
    console.log('\n8️⃣  Testing Activity Logging...');

    const activityData = {
      user_id: 3,
      action_type: 'edited',
      content_id: 1,
      content_type: 'press_release',
      description: 'Updated healthcare policy press release with regional statistics'
    };

    const logActivityResponse = await fetch(`${BASE_URL}/api/team-collaboration/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    });

    const activityResult = await logActivityResponse.json();

    if (activityResult.success) {
      console.log(`   ✓ Activity logged successfully`);

      // Retrieve activity log
      const getActivityResponse = await fetch(`${BASE_URL}/api/team-collaboration/activity?limit=5`);
      const getActivityResult = await getActivityResponse.json();

      if (getActivityResult.success && getActivityResult.activities.length > 0) {
        console.log(`   ✓ Activity log retrieved: ${getActivityResult.activities.length} recent activities`);
        testResults.passed++;
      }
    } else {
      console.log('   ✗ Failed to log activity');
      testResults.failed++;
    }

    // ========================================================================
    // TEST 9: Notifications
    // ========================================================================
    console.log('\n9️⃣  Testing Notifications...');

    const notificationData = {
      user_id: 3,
      notification_type: 'assignment',
      title: 'New Assignment',
      message: 'You have been assigned to write the healthcare policy press release',
      priority: 'high',
      action_url: '/assignments/1'
    };

    const createNotificationResponse = await fetch(`${BASE_URL}/api/team-collaboration/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData)
    });

    const notificationResult = await createNotificationResponse.json();

    if (notificationResult.success) {
      console.log(`   ✓ Notification created`);

      // Get user's notifications
      const getUserNotificationsResponse = await fetch(`${BASE_URL}/api/team-collaboration/users/3/notifications?limit=5`);
      const getUserNotificationsResult = await getUserNotificationsResponse.json();

      if (getUserNotificationsResult.success) {
        console.log(`   ✓ User notifications retrieved: ${getUserNotificationsResult.notifications.length} notifications`);
        testResults.passed++;
      }
    } else {
      console.log('   ✗ Failed to create notification');
      testResults.failed++;
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TEST SUMMARY\n');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%\n`);

    if (testResults.errors.length > 0) {
      console.log('❌ Errors:');
      testResults.errors.forEach(error => console.log(`   - ${error}`));
      console.log();
    }

    console.log('='.repeat(80));
    console.log('\n✅ Workflow & Collaboration System Testing Complete!\n');
    console.log('🌐 Access the dashboard at:');
    console.log('   http://localhost:3001/workflow-dashboard.html\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

testWorkflowSystem();
