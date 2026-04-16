import { useState } from 'react';

const YEAR = new Date().getFullYear();

function Section({
  title, icon, children, accent = '#818cf8',
}: { title: string; icon: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '28px 32px', marginBottom: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,${accent}00,${accent},${accent}00)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{
          color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace',
          fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Para({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <p style={{
      color: dim ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.62)',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      fontSize: 14, lineHeight: 1.75, margin: '0 0 12px 0',
    }}>
      {children}
    </p>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{children}</strong>;
}

function GestureRow({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18,
      padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          color: 'rgba(255,255,255,0.88)', fontFamily: 'system-ui,-apple-system,sans-serif',
          fontSize: 14, fontWeight: 600, marginBottom: 3,
        }}>
          {label}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.42)', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 13,
        }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

function FeatureChip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block',
      background: 'rgba(129,140,248,0.15)',
      border: '1px solid rgba(129,140,248,0.3)',
      color: '#a5b4fc',
      borderRadius: 20, padding: '4px 14px',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      fontSize: 13, margin: '4px 5px 4px 0',
    }}>
      {children}
    </span>
  );
}

type LegalTab = 'privacy' | 'terms';

function LegalSection() {
  const [tab, setTab] = useState<LegalTab>('privacy');
  return (
    <Section title="LEGAL" icon="⚖️" accent="#22c55e">
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['privacy', 'terms'] as LegalTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 13, fontWeight: 600,
              border: tab === t ? '1.5px solid #818cf8' : '1.5px solid rgba(255,255,255,0.1)',
              background: tab === t ? 'rgba(129,140,248,0.18)' : 'rgba(255,255,255,0.04)',
              color: tab === t ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.15s',
            }}
          >
            {t === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          </button>
        ))}
      </div>

      {tab === 'privacy' ? (
        <>
          <Para dim>Effective date: January 1, {YEAR}</Para>
          <Para>
            <Bold>We collect nothing.</Bold> Air Canvas processes all hand-tracking and drawing entirely in your browser.
            No images, video frames, strokes, or drawings are ever sent to our servers — because we don't have servers that touch your content.
          </Para>
          <Para>
            <Bold>Camera access.</Bold> Your webcam is used solely for real-time hand-pose detection running locally via TensorFlow.js.
            No video is recorded, streamed, stored, or transmitted to any third party.
          </Para>
          <Para>
            <Bold>Collaboration.</Bold> When you use Collaborate mode, drawing data is sent peer-to-peer directly to your collaborator's browser using WebRTC.
            A PeerJS signaling server (<em>0.peerjs.com</em>) is used only to exchange connection metadata — it never sees your drawing content.
          </Para>
          <Para>
            <Bold>Cookies &amp; analytics.</Bold> Air Canvas does not use cookies, tracking pixels, or third-party analytics scripts.
          </Para>
          <Para>
            <Bold>Children's privacy.</Bold> Air Canvas is suitable for all ages. We do not knowingly collect any information from anyone, including children under 13.
          </Para>
          <Para>
            <Bold>Changes.</Bold> If our privacy practices change, we will update the effective date above.
            Continued use of Air Canvas after any change constitutes acceptance of the updated policy.
          </Para>
          <Para>
            <Bold>Contact.</Bold> Questions? Reach us at <span style={{ color: '#818cf8' }}>hello@aircanvas.app</span>
          </Para>
        </>
      ) : (
        <>
          <Para dim>Effective date: January 1, {YEAR}</Para>
          <Para>
            Welcome to Air Canvas. By using this application you agree to these Terms of Service. Please read them carefully.
          </Para>
          <Para>
            <Bold>License.</Bold> Air Canvas grants you a personal, non-exclusive, non-transferable, revocable license to use the application
            for personal, educational, and non-commercial creative purposes.
          </Para>
          <Para>
            <Bold>Acceptable use.</Bold> You agree not to use Air Canvas to create, display, or transmit content that is unlawful, harmful,
            threatening, abusive, defamatory, or infringing on the intellectual property rights of others.
          </Para>
          <Para>
            <Bold>Your content.</Bold> Drawings you create belong to you. Air Canvas makes no claim of ownership over any artwork you produce using this application.
          </Para>
          <Para>
            <Bold>Disclaimer.</Bold> Air Canvas is provided "as is" and "as available" without warranties of any kind, express or implied.
            We do not warrant that the service will be uninterrupted, error-free, or suitable for any particular purpose.
          </Para>
          <Para>
            <Bold>Limitation of liability.</Bold> To the fullest extent permitted by law, Air Canvas and its creators shall not be liable
            for any indirect, incidental, special, or consequential damages arising from your use of the application.
          </Para>
          <Para>
            <Bold>Third-party technology.</Bold> Air Canvas uses TensorFlow.js (Apache 2.0) and PeerJS (MIT). Their respective terms apply to those components.
          </Para>
          <Para>
            <Bold>Changes to terms.</Bold> We may update these terms at any time. The effective date will reflect the most recent revision.
            Your continued use after changes constitutes acceptance.
          </Para>
          <Para>
            <Bold>Governing law.</Bold> These terms are governed by the laws of the jurisdiction in which Air Canvas is operated, without regard to conflict-of-law principles.
          </Para>
          <Para>
            <Bold>Contact.</Bold> Questions about these terms? Email us at <span style={{ color: '#818cf8' }}>legal@aircanvas.app</span>
          </Para>
        </>
      )}
    </Section>
  );
}

export function SettingsTab() {
  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: '40px 32px',
      maxWidth: 760, margin: '0 auto', width: '100%',
    }}>

      {/* Hero */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24,
        marginBottom: 40,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, flexShrink: 0,
          background: 'linear-gradient(135deg,#818cf8,#c084fc)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, boxShadow: '0 12px 40px rgba(129,140,248,0.35)',
        }}>
          ✏
        </div>
        <div>
          <div style={{
            color: '#fff', fontFamily: 'monospace',
            fontSize: 28, fontWeight: 900, letterSpacing: '0.12em', lineHeight: 1.1,
          }}>
            AIR CANVAS
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.38)', fontFamily: 'system-ui,-apple-system,sans-serif',
            fontSize: 14, marginTop: 6,
          }}>
            Draw in mid-air. No touch required. Version 1.0
          </div>
        </div>
      </div>

      {/* About */}
      <Section title="ABOUT AIR CANVAS" icon="✨" accent="#818cf8">
        <Para>
          Air Canvas turns your webcam into a drawing studio. Using your bare hands in front of any camera,
          you can paint, sketch, collaborate with friends, and create art — no stylus, no tablet, no touch required.
        </Para>
        <Para>
          Powered by real-time AI hand tracking running entirely in your browser, Air Canvas works on any modern device instantly.
          Your camera feed never leaves your device.
        </Para>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 6 }}>
          <FeatureChip>✏ Free-hand drawing</FeatureChip>
          <FeatureChip>⬡ 8 shape tools</FeatureChip>
          <FeatureChip>🌈 6 brush styles</FeatureChip>
          <FeatureChip>🤝 Live collaboration</FeatureChip>
          <FeatureChip>🤖 AI companion</FeatureChip>
          <FeatureChip>🔒 100% private</FeatureChip>
        </div>
      </Section>

      {/* How to use */}
      <Section title="HOW TO USE" icon="👋" accent="#f59e0b">
        <Para>
          Open the <Bold>Canvas</Bold> tab and allow camera access when prompted. Hold your hand in front of your webcam
          and try the gestures below. The camera preview in the bottom-right corner shows what the tracker sees.
        </Para>
        <div style={{ marginTop: 8 }}>
          <GestureRow icon="☝️" label="Point with index finger" desc="Draw — trace paths freely in the air" />
          <GestureRow icon="🤌" label="Pinch (thumb + index)" desc="Grab & Move — pick up and reposition any stroke or shape" />
          <GestureRow icon="✌️" label="Peace sign (two fingers up)" desc="Erase — sweep across content to erase it point-by-point" />
          <GestureRow icon="🤏" label="Both hands pinch" desc="Resize — pinch with both hands simultaneously to scale objects" />
          <GestureRow icon="◻" label="Select a shape, then index up" desc="Shape mode — place and size geometric shapes" />
        </div>
        <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)' }}>
          <Para>
            <Bold>Pro tip:</Bold> Good lighting and a plain background behind your hand improves tracking accuracy significantly.
            Keep your hand roughly 30–70 cm from the camera.
          </Para>
        </div>
      </Section>

      {/* Companion */}
      <Section title="MEET PIP — YOUR AI COMPANION" icon="🤖" accent="#ec4899">
        <Para>
          Switch to the <Bold>Companion</Bold> tab to meet Pip, your on-canvas drawing buddy.
          Pip watches what you create, reacts with personality, and draws alongside you in real time.
        </Para>
        <Para>
          Pip can detect what you're drawing — sketch a heart and Pip will surround it with stars and sparkles.
          Leave something unfinished and Pip will jump in to help. Click Pip to interact anytime.
        </Para>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 6 }}>
          <FeatureChip>Moves around the canvas</FeatureChip>
          <FeatureChip>Draws in real-time</FeatureChip>
          <FeatureChip>Reacts to your art</FeatureChip>
          <FeatureChip>Detects shapes you draw</FeatureChip>
          <FeatureChip>Funny & friendly</FeatureChip>
        </div>
      </Section>

      {/* Collaborate */}
      <Section title="COLLABORATE IN REAL TIME" icon="🤝" accent="#22c55e">
        <Para>
          Open the <Bold>Collaborate</Bold> tab to draw with anyone in the world. Create a room, share the 4-character code,
          and your collaborator joins with one click. Strokes sync instantly, peer-to-peer — no account required.
        </Para>
        <Para dim>
          Collaboration uses WebRTC (the same technology as video calls). Your drawings go directly between browsers — no data touches our servers.
        </Para>
      </Section>

      {/* Legal (Privacy + Terms) */}
      <LegalSection />

      {/* Contact */}
      <Section title="CONTACT & SUPPORT" icon="💬" accent="#06b6d4">
        <Para>
          We'd love to hear from you — whether it's a bug report, a feature idea, or just to say you made something cool.
        </Para>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          {[
            ['General enquiries', 'hello@aircanvas.app'],
            ['Support', 'support@aircanvas.app'],
            ['Legal & privacy', 'legal@aircanvas.app'],
          ].map(([label, email]) => (
            <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 14 }}>{label}</span>
              <span style={{ color: '#818cf8', fontFamily: 'monospace', fontSize: 13 }}>{email}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '24px 0 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace',
          fontSize: 11, letterSpacing: '0.15em',
        }}>
          © {YEAR} AIR CANVAS · ALL RIGHTS RESERVED
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.1)', fontFamily: 'monospace',
          fontSize: 10, letterSpacing: '0.08em',
        }}>
          MADE WITH ✏ AND GESTURES
        </div>
      </div>
    </div>
  );
}
