import { useState, useEffect } from '@wordpress/element';
import { Card, CardBody, Button, SelectControl, TextControl, TextareaControl, Modal, Notice, ProgressBar } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

export const DocumentWorkflow = ({ postId, currentStatus = 'draft' }) => {
    const [workflowStatus, setWorkflowStatus] = useState(currentStatus);
    const [assignees, setAssignees] = useState([]);
    const [comments, setComments] = useState([]);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [reviewers, setReviewers] = useState([]);
    const [approvals, setApprovals] = useState({});
    const [publishTarget, setPublishTarget] = useState('website');
    const [scheduleDate, setScheduleDate] = useState('');
    const [checklist, setChecklist] = useState({});

    // Workflow stages
    const workflowStages = [
        {
            id: 'initiation',
            name: 'Project Initiation',
            description: 'Document concept and assignment',
            required: ['author', 'deadline', 'document_type'],
            permissions: ['editor', 'admin']
        },
        {
            id: 'research',
            name: 'Research & Planning',
            description: 'Fact-checking and source gathering',
            required: ['sources', 'fact_check'],
            permissions: ['writer', 'researcher']
        },
        {
            id: 'draft',
            name: 'Writing',
            description: 'Content creation',
            required: ['content', 'ai_optimization'],
            permissions: ['writer']
        },
        {
            id: 'review',
            name: 'Editorial Review',
            description: 'Content review and editing',
            required: ['editorial_review', 'legal_review'],
            permissions: ['editor', 'legal']
        },
        {
            id: 'approval',
            name: 'Final Approval',
            description: 'Campaign leadership sign-off',
            required: ['communications_director', 'candidate_approval'],
            permissions: ['communications_director', 'campaign_manager', 'candidate']
        },
        {
            id: 'ready',
            name: 'Ready to Publish',
            description: 'Approved and scheduled',
            required: ['publish_target', 'schedule'],
            permissions: ['communications_director', 'digital_director']
        },
        {
            id: 'published',
            name: 'Published',
            description: 'Live and distributed',
            required: ['distribution_confirmation'],
            permissions: ['digital_director']
        }
    ];

    // Publishing targets
    const publishTargets = [
        { label: 'Campaign Website', value: 'website' },
        { label: 'Social Media', value: 'social' },
        { label: 'Press Release', value: 'press' },
        { label: 'Email Newsletter', value: 'email' },
        { label: 'Print Materials', value: 'print' },
        { label: 'Internal Only', value: 'internal' },
        { label: 'Multiple Channels', value: 'multiple' }
    ];

    // Quality checklist based on document type
    const qualityChecklists = {
        press_release: [
            'Headline under 60 characters for AI optimization',
            'Location and date included',
            'Quote from candidate or spokesperson',
            'Contact information included',
            'AP Style formatting',
            'Legal review completed',
            'Fact-check verified'
        ],
        policy_paper: [
            'Executive summary included',
            'Budget impact analysis',
            'Implementation timeline',
            'Bipartisan considerations',
            'Stakeholder impact assessment',
            'Legal feasibility review',
            'Citation of supporting research'
        ],
        speech: [
            'Timing and venue confirmed',
            'Audience analysis completed',
            'Key messages aligned with campaign themes',
            'Teleprompter formatting',
            'Backup plans for technical issues',
            'Media availability planned',
            'Security clearance obtained'
        ],
        event_notice: [
            'Venue confirmed and accessible',
            'Date and time verified',
            'Registration system set up',
            'Security arrangements made',
            'Media advisory sent',
            'Social media promotion planned',
            'Volunteer coordination confirmed'
        ]
    };

    useEffect(() => {
        loadWorkflowData();
    }, [postId]);

    const loadWorkflowData = async () => {
        // Load existing workflow data for the document
        // In production, this would fetch from WordPress post meta or custom tables
        const mockData = {
            status: 'review',
            assignees: [
                { id: 1, name: 'Sarah Johnson', role: 'Communications Director' },
                { id: 2, name: 'Mike Chen', role: 'Content Writer' }
            ],
            comments: [
                {
                    id: 1,
                    author: 'Sarah Johnson',
                    content: 'Need to strengthen the economic impact section',
                    timestamp: '2024-01-15T10:30:00Z',
                    stage: 'review'
                },
                {
                    id: 2,
                    author: 'Legal Team',
                    content: 'Claims about job creation need additional sourcing',
                    timestamp: '2024-01-15T14:15:00Z',
                    stage: 'review',
                    type: 'concern'
                }
            ],
            approvals: {
                editorial_review: { approved: true, approver: 'Sarah Johnson', date: '2024-01-15' },
                legal_review: { approved: false, approver: null, date: null }
            }
        };

        setWorkflowStatus(mockData.status);
        setAssignees(mockData.assignees);
        setComments(mockData.comments);
        setApprovals(mockData.approvals);
    };

    const getCurrentStage = () => {
        return workflowStages.find(stage => stage.id === workflowStatus);
    };

    const getStageProgress = () => {
        const currentIndex = workflowStages.findIndex(stage => stage.id === workflowStatus);
        return ((currentIndex + 1) / workflowStages.length) * 100;
    };

    const moveToNextStage = async () => {
        const currentIndex = workflowStages.findIndex(stage => stage.id === workflowStatus);
        if (currentIndex < workflowStages.length - 1) {
            const nextStage = workflowStages[currentIndex + 1];
            
            // Check if current stage requirements are met
            const currentStage = workflowStages[currentIndex];
            const unmetRequirements = checkRequirements(currentStage);
            
            if (unmetRequirements.length > 0) {
                alert(`Cannot advance: Missing requirements: ${unmetRequirements.join(', ')}`);
                return;
            }

            setWorkflowStatus(nextStage.id);
            
            // Add system comment
            const systemComment = {
                id: Date.now(),
                author: 'System',
                content: `Document moved to ${nextStage.name} stage`,
                timestamp: new Date().toISOString(),
                stage: nextStage.id,
                type: 'system'
            };
            setComments([...comments, systemComment]);

            // Save to database
            await saveWorkflowState();
        }
    };

    const checkRequirements = (stage) => {
        const unmet = [];
        
        // Check stage-specific requirements
        stage.required.forEach(requirement => {
            switch(requirement) {
                case 'editorial_review':
                    if (!approvals.editorial_review?.approved) unmet.push('Editorial Review');
                    break;
                case 'legal_review':
                    if (!approvals.legal_review?.approved) unmet.push('Legal Review');
                    break;
                case 'fact_check':
                    // Check if fact-checking is complete
                    break;
                case 'content':
                    // Check if document has sufficient content
                    break;
                case 'publish_target':
                    if (!publishTarget) unmet.push('Publishing Target');
                    break;
            }
        });

        return unmet;
    };

    const addComment = () => {
        if (newComment.trim()) {
            const comment = {
                id: Date.now(),
                author: 'Current User', // Would get from current user in production
                content: newComment,
                timestamp: new Date().toISOString(),
                stage: workflowStatus
            };
            
            setComments([...comments, comment]);
            setNewComment('');
            setShowCommentModal(false);
            saveWorkflowState();
        }
    };

    const toggleApproval = (requirement) => {
        const newApprovals = { ...approvals };
        if (newApprovals[requirement]?.approved) {
            newApprovals[requirement] = { approved: false, approver: null, date: null };
        } else {
            newApprovals[requirement] = {
                approved: true,
                approver: 'Current User',
                date: new Date().toISOString().split('T')[0]
            };
        }
        setApprovals(newApprovals);
        saveWorkflowState();
    };

    const saveWorkflowState = async () => {
        // Save workflow state to database
        const workflowData = {
            status: workflowStatus,
            assignees,
            comments,
            approvals,
            publishTarget,
            scheduleDate
        };

        // In production, this would save to WordPress post meta
        console.log('Saving workflow state:', workflowData);
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleDateString() + ' at ' + 
               new Date(timestamp).toLocaleTimeString();
    };

    const currentStage = getCurrentStage();
    const progress = getStageProgress();

    return (
        <div className="document-workflow">
            <Card>
                <CardBody>
                    <div className="workflow-header">
                        <h3>📋 Document Workflow</h3>
                        <div className="workflow-progress">
                            <ProgressBar value={progress} />
                            <span className="progress-text">
                                Stage {workflowStages.findIndex(s => s.id === workflowStatus) + 1} of {workflowStages.length}
                            </span>
                        </div>
                    </div>

                    {/* Current Stage */}
                    <div className="current-stage">
                        <div className="stage-info">
                            <h4>{currentStage?.name}</h4>
                            <p>{currentStage?.description}</p>
                        </div>
                        
                        <div className="stage-requirements">
                            <h5>Requirements for this stage:</h5>
                            <ul>
                                {currentStage?.required.map(requirement => (
                                    <li key={requirement} className="requirement-item">
                                        <span className={`requirement-status ${
                                            approvals[requirement]?.approved ? 'completed' : 'pending'
                                        }`}>
                                            {approvals[requirement]?.approved ? '✓' : '○'}
                                        </span>
                                        <span className="requirement-text">
                                            {requirement.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {currentStage.required.includes(requirement) && (
                                            <Button
                                                isSmall
                                                isPrimary={!approvals[requirement]?.approved}
                                                isSecondary={approvals[requirement]?.approved}
                                                onClick={() => toggleApproval(requirement)}
                                            >
                                                {approvals[requirement]?.approved ? 'Revoke' : 'Approve'}
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Publishing Options */}
                    {workflowStatus === 'ready' && (
                        <div className="publishing-options">
                            <h4>Publishing Configuration</h4>
                            <SelectControl
                                label="Publishing Target"
                                value={publishTarget}
                                options={publishTargets}
                                onChange={setPublishTarget}
                            />
                            
                            {publishTarget !== 'internal' && (
                                <TextControl
                                    label="Schedule Date/Time"
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={setScheduleDate}
                                />
                            )}
                        </div>
                    )}

                    {/* Quality Checklist */}
                    <div className="quality-checklist">
                        <h4>Quality Checklist</h4>
                        {qualityChecklists.press_release?.map((item, index) => (
                            <label key={index} className="checklist-item">
                                <input 
                                    type="checkbox" 
                                    checked={checklist[index] || false}
                                    onChange={(e) => setChecklist({
                                        ...checklist, 
                                        [index]: e.target.checked
                                    })}
                                />
                                {item}
                            </label>
                        ))}
                    </div>

                    {/* Comments Section */}
                    <div className="workflow-comments">
                        <div className="comments-header">
                            <h4>Comments & Notes</h4>
                            <Button isSmall isPrimary onClick={() => setShowCommentModal(true)}>
                                Add Comment
                            </Button>
                        </div>
                        
                        <div className="comments-list">
                            {comments.map(comment => (
                                <div key={comment.id} className={`comment-item ${comment.type || 'normal'}`}>
                                    <div className="comment-header">
                                        <strong>{comment.author}</strong>
                                        <span className="comment-timestamp">
                                            {formatTimestamp(comment.timestamp)}
                                        </span>
                                        <span className="comment-stage">
                                            {comment.stage}
                                        </span>
                                    </div>
                                    <div className="comment-content">
                                        {comment.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Workflow Actions */}
                    <div className="workflow-actions">
                        <Button 
                            isPrimary 
                            onClick={moveToNextStage}
                            disabled={workflowStatus === 'published'}
                        >
                            {workflowStatus === 'ready' ? 'Publish Document' : 'Move to Next Stage'}
                        </Button>
                        
                        <Button isSecondary onClick={saveWorkflowState}>
                            Save Progress
                        </Button>
                        
                        {workflowStatus !== 'initiation' && (
                            <Button isDestructive>
                                Send Back for Revision
                            </Button>
                        )}
                    </div>

                    {/* Assignees */}
                    <div className="workflow-assignees">
                        <h4>Team Members</h4>
                        <div className="assignees-list">
                            {assignees.map(assignee => (
                                <div key={assignee.id} className="assignee-item">
                                    <span className="assignee-name">{assignee.name}</span>
                                    <span className="assignee-role">{assignee.role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Comment Modal */}
            {showCommentModal && (
                <Modal
                    title="Add Comment"
                    onRequestClose={() => setShowCommentModal(false)}
                >
                    <TextareaControl
                        label="Comment"
                        value={newComment}
                        onChange={setNewComment}
                        placeholder="Add your comment or note..."
                        rows={4}
                    />
                    <div className="modal-actions">
                        <Button isPrimary onClick={addComment}>
                            Add Comment
                        </Button>
                        <Button isSecondary onClick={() => setShowCommentModal(false)}>
                            Cancel
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};