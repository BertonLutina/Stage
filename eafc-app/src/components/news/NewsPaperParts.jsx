import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import {
  formatDeskAmount,
  formatMercatoDate,
  formatMercatoFee,
  mercatoStatusLabel,
  stampColor,
} from '@/lib/stageNews';
import { PAPER, paperStyles as s } from './newsPaperStyles';

export function Stamp({ kind, children }) {
  const color = stampColor(kind);
  return (
    <View style={[s.stamp, { borderColor: color }]}>
      <Text style={[s.stampText, { color }]}>{children}</Text>
    </View>
  );
}

export function Mark({ name, image }) {
  const initials = String(name || '?').slice(0, 2).toUpperCase();
  return (
    <View style={s.markRow}>
      {image ? (
        <Image source={{ uri: image }} style={s.markImage} />
      ) : (
        <View style={s.markFallback}>
          <Text style={s.markFallbackText}>{initials}</Text>
        </View>
      )}
      <Text style={s.markName} numberOfLines={2}>{name || 'STAGE'}</Text>
    </View>
  );
}

export function Meta({ label, value }) {
  if (!value) return null;
  return (
    <View>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

export function StoryCard({ story, selected, onSelect }) {
  if (!story) return null;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect?.(story)}
      style={[s.card, selected ? { backgroundColor: '#f6ecc0' } : null]}
    >
      <Stamp kind={story.kind}>{story.stamp}</Stamp>
      <Mark
        name={story.player_name || story.club_name || story.tournament_name}
        image={story.player_avatar_url || story.club_logo_url || story.photo_url}
      />
      <Text style={s.cardTitle}>{story.title}</Text>
      {story.body ? <Text style={s.excerpt}>{story.body}</Text> : null}
      <View style={s.metaRow}>
        <Meta label="Club" value={story.club_name} />
        <Meta label="Player" value={story.player_name} />
        <Meta label="Amount" value={formatDeskAmount(story.amount_stc)} />
        <Meta label="Competition" value={story.tournament_name} />
      </View>
    </TouchableOpacity>
  );
}

export function StoryDetail({ story, onOpenClub, onOpenPlayer, onOpenTournament, onOpenMercato }) {
  if (!story) {
    return <Text style={s.empty}>Select a story from the live tape.</Text>;
  }
  return (
    <View style={s.card}>
      <Stamp kind={story.kind}>{story.stamp}</Stamp>
      <Text style={s.detailTitle}>{story.title}</Text>
      {story.body ? <Text style={s.excerpt}>{story.body}</Text> : null}
      {Array.isArray(story.quotes) && story.quotes.length > 0 ? (
        story.quotes.map((quote, index) => (
          <View key={quote.id || index} style={s.timelineItem}>
            <Text style={s.quoteQ}>{quote.question || 'Quote'}</Text>
            <Text style={s.quoteA}>{quote.answer || quote.quote || quote}</Text>
          </View>
        ))
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {story.player_id ? (
          <Text style={s.link} onPress={() => onOpenPlayer?.(story.player_id)}>Player file</Text>
        ) : null}
        {story.club_id ? (
          <Text style={s.link} onPress={() => onOpenClub?.(story.club_id)}>Club file</Text>
        ) : null}
        {story.transfer_id ? (
          <Text style={s.link} onPress={() => onOpenMercato?.(story.transfer_id)}>Same transfer</Text>
        ) : null}
        {story.tournament_id ? (
          <Text style={s.link} onPress={() => onOpenTournament?.(story.tournament_id)}>Open competition</Text>
        ) : null}
      </View>
    </View>
  );
}

export function FieldCard({ field, selected, onSelect }) {
  if (!field) return null;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect?.(field)}
      style={[s.card, selected ? { backgroundColor: '#f6ecc0' } : null]}
    >
      <Stamp kind={field.current_phase}>{field.stamp}</Stamp>
      <Text style={s.cardTitle}>{field.name}</Text>
      <Text style={s.excerpt}>
        {field.entry_count} {field.participant_type === 'player' ? 'players' : 'clubs'}
        {field.country_count ? ` · ${field.country_count} countries` : ''}
        {field.trophy_name ? ` · Cup: ${field.trophy_name}` : ''}
      </Text>
      {field.trophy_url ? <Image source={{ uri: field.trophy_url }} style={s.trophy} resizeMode="contain" /> : null}
      <View style={s.countries}>
        {(field.countries || []).slice(0, 12).map((row) => (
          <View key={row.code} style={s.countryChip}>
            <Text style={s.countryText}>{row.code}</Text>
          </View>
        ))}
      </View>
      {field.winner_name ? <Text style={s.winner}>Champion: {field.winner_name}</Text> : null}
    </TouchableOpacity>
  );
}

export function FieldDetail({ field, onOpenTournament }) {
  if (!field) {
    return <Text style={s.empty}>Select a cup from the tape.</Text>;
  }
  return (
    <View style={s.card}>
      <Stamp kind={field.current_phase}>{field.stamp}</Stamp>
      <Text style={s.detailTitle}>{field.name}</Text>
      <Text style={s.excerpt}>
        {field.entry_count} sides are in the field
        {field.country_count ? ` from ${field.country_count} countries` : ''}.
        {field.trophy_name ? ` The cup is ${field.trophy_name}.` : ''}
        {field.winner_name ? ` ${field.winner_name} won it.` : ` Current phase: ${field.current_phase_label}.`}
      </Text>
      {field.trophy_url ? <Image source={{ uri: field.trophy_url }} style={s.trophyLarge} resizeMode="contain" /> : null}
      <View style={s.countries}>
        {(field.countries || []).map((row) => (
          <View key={row.code} style={s.countryChip}>
            <Text style={s.countryText}>{row.code} · {row.count}</Text>
          </View>
        ))}
      </View>
      {(field.phases || []).map((phase) => (
        <View key={phase.key} style={s.phaseBlock}>
          <Text style={s.phaseTitle}>{phase.stamp} · {phase.label}</Text>
          {phase.advancers?.length ? <Text style={s.excerpt}>Through: {phase.advancers.join(', ')}</Text> : null}
          {(phase.matches || []).map((match) => (
            <Text key={match.id} style={s.matchLine}>
              {match.home} vs {match.away}
              {match.score ? ` ${match.score}` : ''}
              {match.winner ? ` — ${match.winner} advanced` : ''}
            </Text>
          ))}
        </View>
      ))}
      {field.id ? (
        <Text style={s.link} onPress={() => onOpenTournament?.(field.id)}>Open full bracket</Text>
      ) : null}
    </View>
  );
}

export function BoardList({ title, rows, onSelect, empty }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={s.sectionHead}>{title}</Text>
      {(!rows || rows.length === 0) ? <Text style={s.empty}>{empty}</Text> : null}
      {(rows || []).map((row) => (
        <TouchableOpacity key={row.id} onPress={() => onSelect(row)} style={s.boardButton}>
          <Text style={s.boardStrong}>{row.title || row.name}</Text>
          <Text style={s.boardSpan}>{row.stamp || row.club_name || row.player_name || row.winner_name || ''}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ClubMark({ name, logo, side }) {
  const initials = String(name || '?').slice(0, 2).toUpperCase();
  return (
    <View style={s.clubMark}>
      {logo ? (
        <Image source={{ uri: logo }} style={s.markImage} />
      ) : (
        <View style={s.markFallback}>
          <Text style={s.markFallbackText}>{initials}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.markName} numberOfLines={2}>{name || (side === 'from' ? 'Free agent' : 'Unknown')}</Text>
        <Text style={s.clubSide}>{side === 'from' ? 'FROM' : 'TO'}</Text>
      </View>
    </View>
  );
}

export function MercatoTransferCard({ transfer, selected, onSelect }) {
  if (!transfer) return null;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect?.(transfer)}
      style={[s.card, selected ? { backgroundColor: '#f6ecc0' } : null]}
    >
      <Stamp kind={transfer.status}>{transfer.status_label || mercatoStatusLabel(transfer.status)}</Stamp>
      <View style={s.markRow}>
        {transfer.player_avatar_url ? (
          <Image source={{ uri: transfer.player_avatar_url }} style={s.markImage} />
        ) : (
          <View style={s.markFallback} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.clubSide}>{transfer.deal_type_label || transfer.deal_type}</Text>
          <Text style={s.cardTitle}>{transfer.player_name || 'Player'}</Text>
          <Text style={s.excerpt}>
            {[transfer.player_position, transfer.player_nationality].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>
      <View style={s.routeRow}>
        <ClubMark name={transfer.from_club_name} logo={transfer.from_club_logo_url} side="from" />
        <Text style={s.arrow}>→</Text>
        <ClubMark name={transfer.to_club_name} logo={transfer.to_club_logo_url} side="to" />
      </View>
      <View style={s.metaRow}>
        <Meta label="Transfer Fee" value={formatMercatoFee(transfer.transfer_fee, transfer.currency)} />
        <Meta label="Contract" value={transfer.contract_years ? `${transfer.contract_years} years` : '—'} />
        <Meta label="Date" value={formatMercatoDate(transfer.transfer_date || transfer.last_updated_at)} />
      </View>
    </TouchableOpacity>
  );
}

export function TransferDetail({ transfer, onOpenClub, onOpenPlayer }) {
  if (!transfer) {
    return <Text style={s.empty}>Select a deal from the live tape.</Text>;
  }
  return (
    <View style={s.card}>
      <Stamp kind={transfer.status}>{transfer.status_label || mercatoStatusLabel(transfer.status)}</Stamp>
      <Text style={s.detailTitle}>{transfer.headline}</Text>
      {transfer.body ? <Text style={s.excerpt}>{transfer.body}</Text> : null}
      <View style={s.routeRow}>
        <ClubMark name={transfer.from_club_name} logo={transfer.from_club_logo_url} side="from" />
        <Text style={s.arrow}>→</Text>
        <ClubMark name={transfer.to_club_name} logo={transfer.to_club_logo_url} side="to" />
      </View>
      <View style={s.metaRow}>
        <Meta label="Fee" value={formatMercatoFee(transfer.transfer_fee, transfer.currency)} />
        {Number(transfer.add_ons_amount) > 0 ? (
          <Meta label="Add-ons" value={formatMercatoFee(transfer.add_ons_amount, transfer.currency)} />
        ) : null}
        {Number(transfer.sell_on_clause) > 0 ? (
          <Meta label="Sell-on" value={`${transfer.sell_on_clause}%`} />
        ) : null}
        {Number(transfer.release_clause) > 0 ? (
          <Meta label="Release clause" value={formatMercatoFee(transfer.release_clause, transfer.currency)} />
        ) : null}
        <Meta label="Contract" value={transfer.contract_years ? `${transfer.contract_years} years` : '—'} />
        <Meta
          label="Wage"
          value={Number(transfer.weekly_salary_stc) > 0
            ? `${formatMercatoFee(transfer.weekly_salary_stc, transfer.currency)}${transfer.salary_is_estimate ? ' (est.)' : ''}`
            : 'Private'}
        />
        <Meta label="Source" value={transfer.journalist_name || transfer.source_name || 'STAGE desk'} />
        <Meta label="Reliability" value={String(transfer.reliability || 'medium').toUpperCase()} />
      </View>
      {Array.isArray(transfer.events) && transfer.events.length > 0 ? (
        transfer.events.map((event) => (
          <View key={event.id} style={s.timelineItem}>
            <Text style={s.clubSide}>{formatMercatoDate(event.created_at)}</Text>
            <Text style={s.quoteQ}>{mercatoStatusLabel(event.status)}</Text>
            <Text style={s.quoteA}>{event.title || event.body}</Text>
          </View>
        ))
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {transfer.player_id ? (
          <Text style={s.link} onPress={() => onOpenPlayer?.(transfer.player_id)}>Player file</Text>
        ) : null}
        {transfer.to_club_id ? (
          <Text style={s.link} onPress={() => onOpenClub?.(transfer.to_club_id)}>Buying club</Text>
        ) : null}
        {transfer.from_club_id ? (
          <Text style={s.link} onPress={() => onOpenClub?.(transfer.from_club_id)}>Selling club</Text>
        ) : null}
      </View>
    </View>
  );
}

export function FilterChips({ options, value, onChange }) {
  return (
    <View style={s.filterRow}>
      {options.map((item) => {
        const active = value === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[s.filterChip, active ? s.filterChipActive : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.filterChipText, active ? s.filterChipTextActive : null]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function WindowLine({ children, right }) {
  return (
    <View style={[s.windowLine, { flexDirection: 'row', alignItems: 'center' }]}>
      <Text style={{ color: PAPER.paper, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '800', flex: 1 }}>
        {children}
      </Text>
      {right}
    </View>
  );
}
