import { useEffect, useState, useRef } from 'react';
import { Text, Title, Badge, Button, Group, Box, Avatar, Stack, Image } from '@mantine/core';
import {
  IconTrophy,
  IconX,
  IconSparkles,
  IconStar,
  IconBuildingSkyscraper,
} from '@tabler/icons-react';
import type { IAward } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_LOGO_URL } from '@/constant/config';
import s from './AwardRevealPage.module.css';

// ─── Config ───────────────────────────────────────────────────────────────────
const R = [
  {
    color: '#B8860B',
    accent: '#F5C842',
    glow: 'rgba(245,200,66,0.35)',
    label: '1st Place',
    emoji: '🥇',
    stars: 5,
  },
  {
    color: '#5a7a9a',
    accent: '#8ab4d4',
    glow: 'rgba(138,180,212,0.25)',
    label: '2nd Place',
    emoji: '�',
    stars: 4,
  },
  {
    color: '#8B4513',
    accent: '#D2691E',
    glow: 'rgba(210,105,30,0.25)',
    label: '3rd Place',
    emoji: '🥉',
    stars: 3,
  },
] as const;

const CAT = {
  top_employee: {
    label: 'Outstanding Employee',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.2)',
  },
  top_manager: {
    label: 'Outstanding Manager',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.2)',
  },
} as const;

// ─── Company footer ───────────────────────────────────────────────────────────
function CompanyFooter() {
  return (
    <Box className={s.footer}>
      <Text size="xs" className={s.footerText}>
        {COMPANY_NAME} · {new Date().getFullYear()}
      </Text>
    </Box>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    if (!active) return;
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const cols = [
      '#B8860B',
      '#2563eb',
      '#7c3aed',
      '#059669',
      '#dc2626',
      '#d97706',
      '#0891b2',
      '#db2777',
    ];
    const ps = Array.from({ length: 120 }, () => ({
      x: Math.random() * c.width,
      y: -30 - Math.random() * 200,
      w: 7 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      col: cols[~~(Math.random() * cols.length)],
      rot: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 3,
      vy: 1.8 + Math.random() * 3.5,
      vr: (Math.random() - 0.5) * 0.13,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      let alive = false;
      ps.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.vy += 0.04;
        if (p.y < c.height + 20) alive = true;
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);

  return <canvas ref={ref} className={s.confettiCanvas} />;
}

// ─── Light background ─────────────────────────────────────────────────────────
function LightBg() {
  return (
    <>
      <Box className={s.bgOrb} />
      <Box className={s.bgDotGrid} />
      <Box className={s.bgTopRule} />
    </>
  );
}

// ─── Award card ───────────────────────────────────────────────────────────────
function AwardCard({ award, idx, visible }: { award: IAward; idx: number; visible: boolean }) {
  const r = R[(award.rank - 1) % 3];
  const isFirst = award.rank === 1;
  const name = award.employee?.full_name ?? '—';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const pos = award.employee?.position?.position_name ?? '';

  return (
    <Box
      style={{
        flex: 1,
        minWidth: 0,
        maxWidth: isFirst ? 260 : 220,
        opacity: visible ? 1 : 0,
        transform: visible ? `translateY(${isFirst ? -16 : 0}px)` : 'translateY(40px)',
        transition: `all .75s cubic-bezier(.34,1.3,.64,1) ${0.2 + idx * 0.14}s`,
      }}
    >
      <Box
        className={s.cardInner}
        style={{
          border: `1px solid ${isFirst ? r.color + '44' : 'rgba(0,0,0,0.07)'}`,
          boxShadow: isFirst
            ? `0 12px 40px ${r.glow}, 0 2px 8px rgba(0,0,0,0.06)`
            : '0 2px 12px rgba(0,0,0,0.05)',
        }}
      >
        <Stack align="center" gap={10} p={isFirst ? 'md' : 'sm'}>
          <Group gap={5} align="center">
            <Text style={{ fontSize: isFirst ? 18 : 15 }}>{r.emoji}</Text>
            <Text size="xs" fw={700} style={{ color: r.color, letterSpacing: 0.5 }}>
              {r.label}
            </Text>
          </Group>

          <Avatar
            size={isFirst ? 72 : 58}
            radius="50%"
            src={award.employee?.avatar_url}
            style={{ border: `2px solid ${r.color}`, boxShadow: `0 0 0 3px ${r.color}22` }}
          >
            {initials}
          </Avatar>

          <Stack gap={2} align="center">
            <Text
              fw={700}
              size={isFirst ? 'sm' : 'xs'}
              ta="center"
              style={{ color: '#1a1a2e', lineHeight: 1.3 }}
            >
              {name}
            </Text>
            {pos && (
              <Text size="xs" c="dimmed" ta="center">
                {pos}
              </Text>
            )}
          </Stack>

          <Box className={s.cardDivider} />

          {award.description && (
            <Text size="xs" ta="center" c="dimmed" lineClamp={2} style={{ lineHeight: 1.5 }}>
              {award.description}
            </Text>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

// ─── Personal reveal ──────────────────────────────────────────────────────────
function PersonalReveal({
  award,
  visible,
  onClose,
  previewMode,
}: {
  award: IAward;
  visible: boolean;
  onClose: () => void;
  previewMode: boolean;
}) {
  const r = R[(award.rank - 1) % 3];
  const cat = CAT[award.category as keyof typeof CAT] ?? CAT.top_employee;
  const name = award.employee?.full_name ?? '—';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const pos = award.employee?.position?.position_name ?? '';
  const dept = award.employee?.position?.department?.department_name ?? '';

  return (
    <Box className={s.personalWrap}>
      {previewMode && (
        <Button
          size="xs"
          variant="subtle"
          leftSection={<IconX size={14} />}
          onClick={onClose}
          className={s.closeBtn}
        >
          Close
        </Button>
      )}

      {/* Glow orb */}
      <Box
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${r.glow} 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Top bar */}
      <Box className={s.topBar}>
        <Group
          justify="space-between"
          align="center"
          style={{ opacity: visible ? 1 : 0, transition: 'all .6s ease' }}
        >
          <Group gap="sm">
            {COMPANY_LOGO_URL ? (
              <Image src={COMPANY_LOGO_URL} h={32} w="auto" fit="contain" />
            ) : (
              <Box className={s.companyLogoFallbackSm}>
                <IconBuildingSkyscraper size={20} color="white" />
              </Box>
            )}
            <Stack gap={0}>
              <Text fw={800} size="sm" className={s.companyName}>
                {COMPANY_NAME}
              </Text>
              <Text size="xs" c="dimmed">
                {COMPANY_TAGLINE}
              </Text>
            </Stack>
          </Group>
          <Text className={s.ceremonyLabel}>✦ Award Ceremony · {award.cycle?.title} ✦</Text>
          <Text size="sm" c="dimmed">
            {award.cycle?.announce_date
              ? new Date(award.cycle.announce_date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </Text>
        </Group>
        <Box
          mt={16}
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${r.color}55 40%, ${r.color}55 60%, transparent)`,
          }}
        />
      </Box>

      {/* Main content */}
      <Box className={s.mainContent}>
        <Group align="center" gap={56} className={s.innerGroup}>
          {/* Avatar side */}
          <Stack
            align="center"
            gap={16}
            style={{
              flex: '0 0 220px',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'all .9s cubic-bezier(.34,1.3,.64,1) .1s',
            }}
          >
            <Box style={{ position: 'relative' }}>
              <Avatar
                size={180}
                radius="50%"
                src={award.employee?.avatar_url}
                style={{
                  border: `4px solid ${r.color}`,
                  boxShadow: `0 0 0 8px ${r.accent}28, 0 16px 48px ${r.glow}`,
                }}
              >
                {initials}
              </Avatar>
              <Box className={s.avatarRing} style={{ border: `1.5px solid ${r.color}44` }} />
            </Box>
            <Stack align="center" gap={3}>
              <Text fw={800} size="lg" style={{ color: '#1a1a2e', textAlign: 'center' }}>
                {name}
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                {pos}
                {dept ? ` · ${dept}` : ''}
              </Text>
            </Stack>
            <Group gap={3}>
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStar
                  key={i}
                  size={14}
                  color={i < r.stars ? r.color : '#e0e0e0'}
                  fill={i < r.stars ? r.color : '#e0e0e0'}
                />
              ))}
            </Group>
          </Stack>

          {/* Vertical divider */}
          <Box
            className={s.verticalDivider}
            style={{
              background: `linear-gradient(180deg, transparent, ${r.color}44 20%, ${r.color}44 80%, transparent)`,
            }}
          />

          {/* Certificate side */}
          <Stack
            gap={20}
            style={{
              flex: 1,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(40px)',
              transition: 'all .9s cubic-bezier(.34,1.3,.64,1) .2s',
            }}
          >
            <Group gap={12} align="center">
              <Box
                className={s.trophyIcon}
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${r.accent}55, ${r.accent}22)`,
                  border: `2px solid ${r.color}`,
                  boxShadow: `0 4px 16px ${r.glow}`,
                }}
              >
                <IconTrophy size={28} color={r.color} />
              </Box>
              <Stack gap={1}>
                <Text fw={700} size="sm" style={{ color: r.color, letterSpacing: 1 }}>
                  {r.emoji} {r.label}
                </Text>
                <Text size="xs" c="dimmed">
                  {cat.label}
                </Text>
              </Stack>
            </Group>

            <Stack gap={6}>
              <Text size="xs" c="dimmed" className={s.sectionLabel}>
                Award Title
              </Text>
              <Title order={2} style={{ color: '#1a1a2e', fontWeight: 900, lineHeight: 1.2 }}>
                {award.title}
              </Title>
            </Stack>

            {award.description && (
              <Stack gap={6}>
                <Text size="xs" c="dimmed" className={s.sectionLabel}>
                  Achievements
                </Text>
                <Text size="sm" style={{ color: '#444', lineHeight: 1.85 }}>
                  {award.description}
                </Text>
              </Stack>
            )}

            <Box mt={8} style={{ borderTop: `1px solid ${r.color}33`, paddingTop: 16 }}>
              <Group justify="space-between" align="flex-end">
                <Stack gap={2}>
                  <Box
                    className={s.signatureLine}
                    style={{ background: `linear-gradient(90deg, ${r.color}88, transparent)` }}
                  />
                  <Text size="xs" c="dimmed">
                    Management Board
                  </Text>
                  <Text fw={600} size="sm" style={{ color: '#1a1a2e' }}>
                    {COMPANY_NAME}
                  </Text>
                </Stack>
                {!previewMode && (
                  <Button
                    radius="xl"
                    onClick={onClose}
                    leftSection={<IconSparkles size={18} />}
                    style={{
                      background: `linear-gradient(135deg,${r.color},${r.accent})`,
                      color: 'white',
                      fontWeight: 700,
                      boxShadow: `0 6px 20px ${r.glow}`,
                      border: 'none',
                    }}
                  >
                    Congratulations! 🎉
                  </Button>
                )}
              </Group>
            </Box>
          </Stack>
        </Group>
      </Box>

      <Box className={s.personalFooter}>
        <Text size="xs" c="dimmed">
          {COMPANY_NAME} · {new Date().getFullYear()}
        </Text>
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props {
  awards: IAward[];
  onClose: () => void;
  previewMode?: boolean;
  personal?: boolean;
}

export function AwardRevealPage({ awards, onClose, previewMode = false, personal = false }: Props) {
  const [visible, setVisible] = useState(false);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 150);
    const t2 = setTimeout(() => setConfetti(true), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const isSingle = personal || awards.length === 1;
  const employees = awards
    .filter((a) => a.category === 'top_employee')
    .sort((a, b) => a.rank - b.rank);
  const managers = awards
    .filter((a) => a.category === 'top_manager')
    .sort((a, b) => a.rank - b.rank);
  const categories = [
    ...(employees.length ? [{ key: 'top_employee', list: employees }] : []),
    ...(managers.length ? [{ key: 'top_manager', list: managers }] : []),
  ];
  const first = awards[0];

  return (
    <Box className={s.overlay}>
      <LightBg />
      <Confetti active={confetti} />

      {isSingle && first ? (
        <PersonalReveal
          award={first}
          visible={visible}
          onClose={onClose}
          previewMode={previewMode}
        />
      ) : (
        <Stack gap={0} style={{ minHeight: '100vh' }}>
          {/* Header */}
          <Box className={s.allHeader}>
            {previewMode && (
              <Button
                size="xs"
                variant="subtle"
                leftSection={<IconX size={14} />}
                onClick={onClose}
                className={s.closeBtnAll}
              >
                Close
              </Button>
            )}

            <Group
              justify="space-between"
              align="center"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(-16px)',
                transition: 'all .7s ease',
              }}
            >
              {/* Company */}
              <Group gap="sm" align="center" className={s.companyGroup}>
                {COMPANY_LOGO_URL ? (
                  <Image src={COMPANY_LOGO_URL} h={36} w="auto" fit="contain" />
                ) : (
                  <Box className={s.companyLogoFallback}>
                    <IconBuildingSkyscraper size={24} color="white" />
                  </Box>
                )}
                <Stack gap={1}>
                  <Text fw={800} size="sm" className={s.companyName}>
                    {COMPANY_NAME}
                  </Text>
                  <Text size="xs" className={s.companyTagline}>
                    {COMPANY_TAGLINE}
                  </Text>
                </Stack>
              </Group>

              {/* Center title */}
              <Stack align="center" gap={4} style={{ flex: 1, textAlign: 'center' }}>
                <Text className={s.eventLabel}>✦ Award Ceremony ✦</Text>
                <Title className={s.shimmerTitle}>{first?.cycle?.title ?? 'Award Ceremony'}</Title>
              </Stack>

              {/* Date */}
              <Stack align="flex-end" gap={2} className={s.dateStack}>
                {first?.cycle?.announce_date && (
                  <>
                    <Text size="xs" className={s.dateLabel}>
                      Announce Date
                    </Text>
                    <Text fw={600} size="sm" className={s.dateValue}>
                      {new Date(first.cycle.announce_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </>
                )}
              </Stack>
            </Group>

            <Box mt={20} className={s.headerDivider} />
          </Box>

          {/* Categories */}
          <Stack gap={56} px={{ base: 'md', md: 'xl' }} pb={64} className={s.categoriesStack}>
            {categories.map((cat, ci) => {
              const meta = CAT[cat.key as keyof typeof CAT];
              return (
                <Stack key={cat.key} gap={24}>
                  <Group
                    justify="center"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateY(0)' : 'translateY(16px)',
                      transition: `all .6s ease ${0.15 + ci * 0.12}s`,
                    }}
                  >
                    <Box
                      className={s.catDividerLine}
                      style={{ background: `linear-gradient(90deg, transparent, ${meta.color}55)` }}
                    />
                    <Badge
                      size="lg"
                      radius="xl"
                      style={{
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                        padding: '8px 24px',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      🏆 {meta.label}
                    </Badge>
                    <Box
                      className={s.catDividerLine}
                      style={{ background: `linear-gradient(90deg, ${meta.color}55, transparent)` }}
                    />
                  </Group>

                  <Group justify="center" align="flex-end" gap="md">
                    {[
                      cat.list.find((a) => a.rank === 2),
                      cat.list.find((a) => a.rank === 1),
                      cat.list.find((a) => a.rank === 3),
                    ]
                      .filter(Boolean)
                      .map((award, i) => (
                        <AwardCard
                          key={award!.id}
                          award={award!}
                          idx={ci * 3 + i}
                          visible={visible}
                        />
                      ))}
                  </Group>
                </Stack>
              );
            })}
          </Stack>

          {!previewMode && (
            <Box className={s.ctaWrap}>
              <Button
                size="xl"
                radius="xl"
                onClick={onClose}
                leftSection={<IconSparkles size={22} />}
                className={s.ctaBtn}
              >
                Congratulations to all! 🎉
              </Button>
              <Box mt="md">
                <CompanyFooter />
              </Box>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}
