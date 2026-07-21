import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, GradientHeader, Row, Screen, Tag } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { updateSettings } from '@/services/orgs';
import { formatDayLabel, todayISO } from '@/logic/datetime';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HolidaysScreen() {
  const { org } = useApp();
  const [newDate, setNewDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);

  if (!org) return null;
  const active = org.settings.activeWeekdays;
  const holidays = [...org.settings.holidays].sort();

  const toggleDay = async (day: number) => {
    const next = active.includes(day) ? active.filter((d) => d !== day) : [...active, day].sort();
    setBusy(true);
    try {
      await updateSettings(org.id, { activeWeekdays: next });
    } finally {
      setBusy(false);
    }
  };

  const addHoliday = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return Alert.alert('Invalid date', 'Use yyyy-mm-dd.');
    if (holidays.includes(newDate)) return;
    setBusy(true);
    try {
      await updateSettings(org.id, { holidays: [...holidays, newDate] });
    } finally {
      setBusy(false);
    }
  };

  const removeHoliday = async (date: string) => {
    setBusy(true);
    try {
      await updateSettings(org.id, { holidays: holidays.filter((h) => h !== date) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.fill}>
      <GradientHeader title="Holidays & off days" subtitle="Days with no tiffin auto-skip reminders" gradient="teal" />
      <Screen>
        <Card>
          <Text style={styles.cardTitle}>Tiffin runs on</Text>
          <Row style={{ flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
            {WEEKDAYS.map((d, i) => (
              <Pressable
                key={d}
                disabled={busy}
                onPress={() => toggleDay(i)}
                style={[styles.day, active.includes(i) && styles.dayActive]}
              >
                <Text style={[styles.dayText, active.includes(i) && styles.dayTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </Row>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Add a holiday</Text>
          <Field label="Date (yyyy-mm-dd)" value={newDate} onChangeText={setNewDate} placeholder={todayISO()} />
          <Button label="Add holiday" onPress={addHoliday} loading={busy} variant="outline" gradient="teal" />
        </Card>

        <Text style={styles.section}>Upcoming holidays</Text>
        {holidays.length === 0 ? (
          <Text style={styles.muted}>None set.</Text>
        ) : (
          holidays.map((h) => (
            <Card key={h} style={styles.row}>
              <Text style={styles.holidayText}>{formatDayLabel(h)}</Text>
              <Pressable onPress={() => removeHoliday(h)}>
                <Tag text="Remove" tone="due" />
              </Pressable>
            </Card>
          ))
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  day: { width: 44, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgWarm, borderWidth: 1, borderColor: colors.line },
  dayActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  dayText: { fontWeight: '700', color: colors.body, fontSize: 12 },
  dayTextActive: { color: colors.white },
  section: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.lg, marginBottom: spacing.xs },
  muted: { color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  holidayText: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
