import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, TextControl, DateTimePicker, SelectControl, ToggleControl, RangeControl } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

registerBlockType('campaign/event-schema', {
    title: 'Campaign Event (AI-Optimized)',
    icon: 'calendar-alt',
    category: 'campaign-schema',
    attributes: {
        eventName: { type: 'string', default: '' },
        eventType: { type: 'string', default: 'PoliticalEvent' },
        description: { type: 'string', default: '' },
        startDate: { type: 'string', default: '' },
        endDate: { type: 'string', default: '' },
        venue: {
            type: 'object',
            default: {
                name: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                latitude: null,
                longitude: null
            }
        },
        speakers: {
            type: 'array',
            default: []
        },
        ticketInfo: {
            type: 'object',
            default: {
                price: 'Free',
                url: '',
                availability: 'InStock'
            }
        },
        virtualEvent: { type: 'boolean', default: false },
        virtualUrl: { type: 'string', default: '' },
        expectedAttendance: { type: 'number', default: 100 },
        accessibilityInfo: { type: 'string', default: '' },
        schemaMarkup: { type: 'object', default: {} }
    },

    edit: ({ attributes, setAttributes }) => {
        const [geoCoordinates, setGeoCoordinates] = useState(null);

        // Generate comprehensive schema markup
        useEffect(() => {
            const schema = {
                '@context': 'https://schema.org',
                '@type': 'Event',
                '@id': `#event-${Date.now()}`,
                'name': attributes.eventName,
                'eventType': attributes.eventType,
                'description': attributes.description,
                'startDate': attributes.startDate,
                'endDate': attributes.endDate || attributes.startDate,
                'eventStatus': 'EventScheduled',
                'eventAttendanceMode': attributes.virtualEvent ? 'MixedEventAttendanceMode' : 'OfflineEventAttendanceMode',
                'location': attributes.virtualEvent ? [
                    {
                        '@type': 'Place',
                        'name': attributes.venue.name,
                        'address': {
                            '@type': 'PostalAddress',
                            'streetAddress': attributes.venue.address,
                            'addressLocality': attributes.venue.city,
                            'addressRegion': attributes.venue.state,
                            'postalCode': attributes.venue.zip,
                            'addressCountry': 'US'
                        },
                        ...(attributes.venue.latitude && {
                            'geo': {
                                '@type': 'GeoCoordinates',
                                'latitude': attributes.venue.latitude,
                                'longitude': attributes.venue.longitude
                            }
                        })
                    },
                    {
                        '@type': 'VirtualLocation',
                        'url': attributes.virtualUrl
                    }
                ] : {
                    '@type': 'Place',
                    'name': attributes.venue.name,
                    'address': {
                        '@type': 'PostalAddress',
                        'streetAddress': attributes.venue.address,
                        'addressLocality': attributes.venue.city,
                        'addressRegion': attributes.venue.state,
                        'postalCode': attributes.venue.zip,
                        'addressCountry': 'US'
                    }
                },
                'organizer': {
                    '@type': 'Organization',
                    'name': campaignAI?.candidateProfile?.campaignName || 'Campaign HQ',
                    'url': campaignAI?.candidateProfile?.website || ''
                },
                'performer': attributes.speakers.map(speaker => ({
                    '@type': 'Person',
                    'name': speaker.name,
                    'jobTitle': speaker.title
                })),
                'offers': {
                    '@type': 'Offer',
                    'price': attributes.ticketInfo.price === 'Free' ? 0 : attributes.ticketInfo.price,
                    'priceCurrency': 'USD',
                    'availability': `https://schema.org/${attributes.ticketInfo.availability}`,
                    'url': attributes.ticketInfo.url,
                    'validFrom': new Date().toISOString()
                },
                'maximumAttendeeCapacity': attributes.expectedAttendance,
                'accessibilitySupport': attributes.accessibilityInfo,
                
                // Rich snippets for voice assistants
                'speakable': {
                    '@type': 'SpeakableSpecification',
                    'cssSelector': ['.event-name', '.event-date', '.event-venue']
                },
                
                // Additional political event metadata
                'about': {
                    '@type': 'Thing',
                    'name': 'Campaign Event',
                    'description': 'Political campaign event'
                },
                
                // Q&A potential
                'potentialAction': {
                    '@type': 'RsvpAction',
                    'target': {
                        '@type': 'EntryPoint',
                        'urlTemplate': attributes.ticketInfo.url,
                        'actionPlatform': ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform']
                    }
                }
            };

            setAttributes({ schemaMarkup: schema });
        }, [
            attributes.eventName,
            attributes.eventType,
            attributes.description,
            attributes.startDate,
            attributes.endDate,
            attributes.venue,
            attributes.speakers,
            attributes.virtualEvent,
            attributes.virtualUrl
        ]);

        // Geocode address for better local discovery
        const geocodeAddress = async () => {
            if (attributes.venue.address && attributes.venue.city && attributes.venue.state) {
                // In production, this would call a geocoding API
                // For demo, we'll simulate with fake coordinates
                const coords = {
                    latitude: 30.2672 + Math.random() * 0.1,
                    longitude: -97.7431 + Math.random() * 0.1
                };
                setAttributes({
                    venue: { ...attributes.venue, ...coords }
                });
                setGeoCoordinates(coords);
            }
        };

        const addSpeaker = () => {
            const newSpeaker = { name: '', title: '' };
            setAttributes({
                speakers: [...attributes.speakers, newSpeaker]
            });
        };

        return (
            <>
                <InspectorControls>
                    <PanelBody title="Event Details">
                        <SelectControl
                            label="Event Type"
                            value={attributes.eventType}
                            options={[
                                { label: 'Rally', value: 'PoliticalRally' },
                                { label: 'Town Hall', value: 'TownHall' },
                                { label: 'Fundraiser', value: 'Fundraiser' },
                                { label: 'Debate', value: 'PoliticalDebate' },
                                { label: 'Meet & Greet', value: 'MeetAndGreet' },
                                { label: 'Policy Forum', value: 'PolicyForum' }
                            ]}
                            onChange={(eventType) => setAttributes({ eventType })}
                        />
                        
                        <DateTimePicker
                            label="Start Date/Time"
                            currentDate={attributes.startDate}
                            onChange={(startDate) => setAttributes({ startDate })}
                        />
                        
                        <DateTimePicker
                            label="End Date/Time (Optional)"
                            currentDate={attributes.endDate}
                            onChange={(endDate) => setAttributes({ endDate })}
                        />

                        <RangeControl
                            label="Expected Attendance"
                            value={attributes.expectedAttendance}
                            onChange={(expectedAttendance) => setAttributes({ expectedAttendance })}
                            min={10}
                            max={10000}
                            step={10}
                        />
                    </PanelBody>

                    <PanelBody title="Venue Information">
                        <TextControl
                            label="Venue Name"
                            value={attributes.venue.name}
                            onChange={(name) => setAttributes({
                                venue: { ...attributes.venue, name }
                            })}
                            help="Be specific for better local SEO"
                        />
                        
                        <TextControl
                            label="Street Address"
                            value={attributes.venue.address}
                            onChange={(address) => setAttributes({
                                venue: { ...attributes.venue, address }
                            })}
                        />
                        
                        <TextControl
                            label="City"
                            value={attributes.venue.city}
                            onChange={(city) => setAttributes({
                                venue: { ...attributes.venue, city }
                            })}
                        />
                        
                        <TextControl
                            label="State"
                            value={attributes.venue.state}
                            onChange={(state) => setAttributes({
                                venue: { ...attributes.venue, state }
                            })}
                            maxLength={2}
                        />
                        
                        <TextControl
                            label="ZIP Code"
                            value={attributes.venue.zip}
                            onChange={(zip) => setAttributes({
                                venue: { ...attributes.venue, zip }
                            })}
                        />

                        <button onClick={geocodeAddress} className="components-button is-secondary">
                            Get Coordinates for Maps
                        </button>
                        
                        {geoCoordinates && (
                            <p>📍 Coordinates added for map discovery</p>
                        )}
                    </PanelBody>

                    <PanelBody title="Virtual Event Options">
                        <ToggleControl
                            label="Include Virtual Attendance"
                            checked={attributes.virtualEvent}
                            onChange={(virtualEvent) => setAttributes({ virtualEvent })}
                        />
                        
                        {attributes.virtualEvent && (
                            <TextControl
                                label="Virtual Event URL"
                                value={attributes.virtualUrl}
                                onChange={(virtualUrl) => setAttributes({ virtualUrl })}
                                type="url"
                            />
                        )}
                    </PanelBody>

                    <PanelBody title="Accessibility">
                        <TextControl
                            label="Accessibility Information"
                            value={attributes.accessibilityInfo}
                            onChange={(accessibilityInfo) => setAttributes({ accessibilityInfo })}
                            help="ADA accommodations, sign language, etc."
                        />
                    </PanelBody>
                </InspectorControls>

                <div className="campaign-event-block">
                    <div className="event-header">
                        <RichText
                            tagName="h2"
                            className="event-name"
                            placeholder="Event Name (e.g., 'Town Hall on Healthcare Reform')"
                            value={attributes.eventName}
                            onChange={(eventName) => setAttributes({ eventName })}
                        />
                        
                        <div className="event-meta">
                            <span className="event-type">{attributes.eventType.replace(/([A-Z])/g, ' $1').trim()}</span>
                            {attributes.virtualEvent && <span className="virtual-badge">Virtual Option Available</span>}
                        </div>
                    </div>

                    <RichText
                        tagName="div"
                        className="event-description"
                        placeholder="Describe the event in detail. Include key topics, what attendees will learn, and why they should attend. This helps AI systems understand the event's purpose."
                        value={attributes.description}
                        onChange={(description) => setAttributes({ description })}
                        multiline="p"
                    />

                    <div className="event-details">
                        <div className="event-date">
                            <strong>When:</strong> {attributes.startDate ? new Date(attributes.startDate).toLocaleString() : 'Date TBD'}
                        </div>
                        
                        <div className="event-venue">
                            <strong>Where:</strong> {attributes.venue.name || 'Venue TBD'}
                            {attributes.venue.city && `, ${attributes.venue.city}, ${attributes.venue.state}`}
                        </div>
                        
                        {attributes.virtualEvent && (
                            <div className="event-virtual">
                                <strong>Virtual:</strong> Online attendance available
                            </div>
                        )}
                    </div>

                    <div className="speakers-section">
                        <h3>Featured Speakers</h3>
                        {attributes.speakers.map((speaker, index) => (
                            <div key={index} className="speaker-item">
                                <input
                                    type="text"
                                    placeholder="Speaker Name"
                                    value={speaker.name}
                                    onChange={(e) => {
                                        const newSpeakers = [...attributes.speakers];
                                        newSpeakers[index].name = e.target.value;
                                        setAttributes({ speakers: newSpeakers });
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Title/Role"
                                    value={speaker.title}
                                    onChange={(e) => {
                                        const newSpeakers = [...attributes.speakers];
                                        newSpeakers[index].title = e.target.value;
                                        setAttributes({ speakers: newSpeakers });
                                    }}
                                />
                            </div>
                        ))}
                        <button onClick={addSpeaker} className="components-button is-secondary">
                            Add Speaker
                        </button>
                    </div>

                    <div className="ai-optimization-tips">
                        <h4>🤖 AI Optimization Tips</h4>
                        <ul>
                            <li>✓ Schema markup generated for Google Events</li>
                            <li>✓ Location data optimized for "near me" searches</li>
                            <li>✓ Speakable markup for voice assistants</li>
                            <li>{attributes.description.length > 100 ? '✓' : '⚠'} Event description {attributes.description.length > 100 ? 'is detailed' : 'needs more detail (100+ chars)'}</li>
                            <li>{attributes.speakers.length > 0 ? '✓' : '⚠'} Speaker information {attributes.speakers.length > 0 ? 'included' : 'missing'}</li>
                        </ul>
                    </div>
                </div>

                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify(attributes.schemaMarkup, null, 2)
                }} />
            </>
        );
    },

    save: ({ attributes }) => {
        return (
            <div className="campaign-event-block">
                <div className="event-header">
                    <h2 className="event-name">{attributes.eventName}</h2>
                    <div className="event-meta">
                        <span className="event-type">{attributes.eventType.replace(/([A-Z])/g, ' $1').trim()}</span>
                        {attributes.virtualEvent && <span className="virtual-badge">Virtual Option Available</span>}
                    </div>
                </div>

                <div className="event-description">
                    {attributes.description}
                </div>

                <div className="event-details">
                    <div className="event-date">
                        <strong>When:</strong> {attributes.startDate ? new Date(attributes.startDate).toLocaleString() : 'Date TBD'}
                    </div>
                    
                    <div className="event-venue">
                        <strong>Where:</strong> {attributes.venue.name}
                        {attributes.venue.city && `, ${attributes.venue.city}, ${attributes.venue.state}`}
                    </div>
                    
                    {attributes.virtualEvent && (
                        <div className="event-virtual">
                            <strong>Virtual:</strong> <a href={attributes.virtualUrl}>Join Online</a>
                        </div>
                    )}
                </div>

                {attributes.speakers.length > 0 && (
                    <div className="speakers-section">
                        <h3>Featured Speakers</h3>
                        <ul>
                            {attributes.speakers.map((speaker, index) => (
                                <li key={index}>
                                    <strong>{speaker.name}</strong> - {speaker.title}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify(attributes.schemaMarkup, null, 2)
                }} />
            </div>
        );
    }
});