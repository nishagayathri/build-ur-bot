"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { AccountPersona } from "@/types";
import { useUpdatePersona } from "@/hooks/useUpdatePersona";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TopicWeightSliders } from "@/components/personalities/TopicWeightSliders";

interface PersonaSettingsTabProps {
  persona: AccountPersona;
}

export function PersonaSettingsTab({ persona }: PersonaSettingsTabProps) {
  const [voice, setVoice] = useState(persona.voice);
  const [weights, setWeights] = useState(persona.topic_weights);
  const [maxPosts, setMaxPosts] = useState(persona.max_posts_per_day);
  const [startHour, setStartHour] = useState(persona.posting_hours.start);
  const [endHour, setEndHour] = useState(persona.posting_hours.end);
  const [offLimits, setOffLimits] = useState<string[]>(
    persona.off_limits_topics,
  );
  const [newTopic, setNewTopic] = useState("");

  const { mutate: save, isPending } = useUpdatePersona(persona.persona_id);

  function handleAddTopic() {
    const trimmed = newTopic.trim();
    if (trimmed && !offLimits.includes(trimmed)) {
      setOffLimits([...offLimits, trimmed]);
      setNewTopic("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTopic();
    }
  }

  function handleSave() {
    save({
      voice,
      topicWeights: weights,
      maxPostsPerDay: maxPosts,
      postingHours: { start: startHour, end: endHour },
      offLimitsTopics: offLimits,
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label className="text-[13px]">Voice &amp; Tone</Label>
        <Textarea
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          rows={4}
          className="text-[13px]"
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-[13px]">Topic Weights</Label>
        <TopicWeightSliders weights={weights} onChange={setWeights} />
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[13px]">Max posts per day</Label>
          <Input
            type="number"
            value={maxPosts}
            onChange={(e) => setMaxPosts(Number(e.target.value))}
            min={1}
            max={50}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[13px]">Start hour</Label>
          <Input
            type="number"
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            min={0}
            max={23}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[13px]">End hour</Label>
          <Input
            type="number"
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            min={0}
            max={23}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-[13px]">Off-limits topics</Label>
        <div className="flex flex-wrap gap-1.5">
          {offLimits.map((topic) => (
            <Badge key={topic} variant="secondary" className="gap-1 text-[11px]">
              {topic}
              <button
                type="button"
                onClick={() =>
                  setOffLimits(offLimits.filter((t) => t !== topic))
                }
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add topic and press Enter"
          className="text-[13px]"
        />
      </div>

      <div className="pt-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
