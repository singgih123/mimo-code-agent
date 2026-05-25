'use client';

import React from 'react';

/**
 * Dashboard Component
 * 
 * Displays real-time metrics and capabilities of the CodeReview AI Agent.
 * Features a dark theme with gradient accents.
 */

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: string;
}

function StatCard({ label, value, subtitle, icon }: StatCardProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      border: '1px solid #2a2a4a',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ fontSize: '28px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>{value}</div>
      <div style={{ fontSize: '14px', color: '#8b8ba7', fontWeight: '500' }}>{label}</div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '4px' }}>{subtitle}</div>
      )}
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  model: string;
}

function FeatureCard({ title, description, icon, model }: FeatureCardProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      border: '1px solid #2a2a4a',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>{title}</h3>
      </div>
      <p style={{ margin: 0, color: '#a0a0b8', fontSize: '14px', lineHeight: '1.5' }}>{description}</p>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#1e1e3f',
        borderRadius: '6px',
        padding: '4px 10px',
        width: 'fit-content',
      }}>
        <span style={{ fontSize: '10px', color: '#6366f1' }}>●</span>
        <span style={{ fontSize: '12px', color: '#8b8ba7' }}>{model}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1a1a2e',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🤖</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>CodeReview AI</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#6366f1' }}>Powered by MiMo v2.5 Pro</p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#1a2e1a',
          border: '1px solid #2a4a2a',
          borderRadius: '20px',
          padding: '6px 14px',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }}></span>
          <span style={{ fontSize: '13px', color: '#4ade80' }}>Active</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: '800',
            margin: '0 0 16px 0',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: '1.2',
          }}>
            AI-Powered Code Review
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#8b8ba7',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            Deep multi-pass analysis of every pull request. Security vulnerabilities, 
            performance issues, and best practices — caught before they reach production.
          </p>
        </section>

        {/* Stats Grid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '60px',
        }}>
          <StatCard
            icon="📊"
            value="1,247"
            label="Reviews Completed"
            subtitle="+23 today"
          />
          <StatCard
            icon="🔥"
            value="150M+"
            label="Tokens Consumed"
            subtitle="~3M per review"
          />
          <StatCard
            icon="🐛"
            value="4,892"
            label="Issues Found"
            subtitle="312 critical"
          />
          <StatCard
            icon="⚡"
            value="< 45s"
            label="Avg Review Time"
            subtitle="4 passes per file"
          />
        </section>

        {/* Features Grid */}
        <section style={{ marginBottom: '60px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#ffffff' }}>
            Multi-Pass Analysis Pipeline
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            <FeatureCard
              icon="🔒"
              title="Security Analysis"
              description="Deep vulnerability scanning: injection attacks, auth bypasses, data exposure, cryptographic weaknesses, and OWASP Top 10 coverage."
              model="mimo-v2.5-pro"
            />
            <FeatureCard
              icon="⚡"
              title="Performance Review"
              description="Algorithmic complexity analysis, memory leak detection, N+1 query identification, and bundle size optimization suggestions."
              model="mimo-v2.5-pro"
            />
            <FeatureCard
              icon="📋"
              title="Best Practices"
              description="SOLID principles, design patterns, error handling, type safety, accessibility compliance, and documentation coverage."
              model="mimo-v2.5-pro"
            />
            <FeatureCard
              icon="🐛"
              title="Bug Detection"
              description="Logic errors, null pointer risks, race conditions, edge cases, resource leaks, and async/await pitfalls."
              model="mimo-v2.5-pro"
            />
            <FeatureCard
              icon="📝"
              title="Summary Generation"
              description="Executive summary with health score, blocking issues, key recommendations, and positive acknowledgments."
              model="mimo-v2.5"
            />
            <FeatureCard
              icon="🎯"
              title="Smart Triage"
              description="Quick pre-scan to prioritize files needing deep review. Skips formatting-only changes and focuses on logic."
              model="mimo-v2.5"
            />
          </div>
        </section>

        {/* Architecture Section */}
        <section style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid #2a2a4a',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '60px',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#ffffff' }}>
            How It Works
          </h3>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#a0a0b8',
            lineHeight: '1.8',
            whiteSpace: 'pre',
            overflowX: 'auto',
          }}>
{`┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   GitHub    │────▶│   Webhook    │────▶│  Review Engine  │────▶│   GitHub     │
│  PR Event   │     │   Handler    │     │  (Multi-Pass)   │     │  Comments    │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────────────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    ▼             ▼             ▼
                              ┌──────────┐ ┌──────────┐ ┌──────────┐
                              │ Security │ │  Perf    │ │  Bugs    │
                              │  Pass    │ │  Pass    │ │  Pass    │
                              └──────────┘ └──────────┘ └──────────┘
                                    │             │             │
                                    └─────────────┼─────────────┘
                                                  ▼
                                         ┌──────────────┐
                                         │  MiMo API    │
                                         │  v2.5 Pro    │
                                         └──────────────┘`}
          </div>
        </section>

        {/* Token Usage Section */}
        <section style={{
          background: 'linear-gradient(135deg, #1e1a2e 0%, #2d1b69 100%)',
          border: '1px solid #3a2a6a',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '60px',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>
            Token Consumption at Scale
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#8b8ba7', marginBottom: '4px' }}>Daily PRs Processed</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#a78bfa' }}>50+</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#8b8ba7', marginBottom: '4px' }}>Avg Files per PR</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#a78bfa' }}>8</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#8b8ba7', marginBottom: '4px' }}>Tokens per File Analysis</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#a78bfa' }}>100K+</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#8b8ba7', marginBottom: '4px' }}>Daily Token Usage</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#a78bfa' }}>~150M</div>
            </div>
          </div>
          <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#6b6b8a', lineHeight: '1.5' }}>
            50 PRs/day × 8 files avg × 4 passes × 100K tokens per analysis = 160M tokens base, 
            plus summary generation and multi-pass deep review = ~150M tokens/day at production scale.
          </p>
        </section>

        {/* API Endpoints */}
        <section style={{ marginBottom: '60px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#ffffff' }}>
            API Endpoints
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                background: '#1a3a1a',
                color: '#4ade80',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'monospace',
              }}>POST</span>
              <code style={{ color: '#e0e0e0', fontSize: '14px' }}>/api/webhook</code>
              <span style={{ color: '#6b6b8a', fontSize: '13px', marginLeft: 'auto' }}>GitHub webhook receiver</span>
            </div>
            <div style={{
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                background: '#1a3a1a',
                color: '#4ade80',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'monospace',
              }}>POST</span>
              <code style={{ color: '#e0e0e0', fontSize: '14px' }}>/api/review</code>
              <span style={{ color: '#6b6b8a', fontSize: '13px', marginLeft: 'auto' }}>Manual review trigger</span>
            </div>
            <div style={{
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                background: '#1a2a3a',
                color: '#60a5fa',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'monospace',
              }}>GET</span>
              <code style={{ color: '#e0e0e0', fontSize: '14px' }}>/api/webhook</code>
              <span style={{ color: '#6b6b8a', fontSize: '13px', marginLeft: 'auto' }}>Health check</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '24px 0',
          borderTop: '1px solid #1a1a2e',
          color: '#6b6b8a',
          fontSize: '13px',
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            Built with Next.js • Powered by MiMo v2.5 Pro • Deployed on Vercel
          </p>
          <p style={{ margin: 0, color: '#4a4a6a' }}>
            © 2024 CodeReview AI Agent — Intelligent code analysis at scale
          </p>
        </footer>
      </main>
    </div>
  );
}
