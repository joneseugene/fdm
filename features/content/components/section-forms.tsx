"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_ICON_NAMES, SOCIAL_PLATFORMS, SOCIAL_PLATFORM_IDS, ServiceIcon } from "../icons";
import type { SectionKey } from "../schemas";
import { ImageField, ListField, SelectField, SwitchField, TextField } from "./fields";

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      {/* Tighter padding on phones leaves more room for the fields. */}
      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">{children}</CardContent>
    </Card>
  );
}

const Row = ({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

function VisibleField() {
  return <SwitchField name="visible" label="Show this section" description="Turn off to hide it from the website." />;
}

function HeadingFields() {
  return (
    <Group title="Heading">
      <TextField name="eyebrow" label="Small label" description="Shown above the title, e.g. “Our Services”." />
      <TextField name="title" label="Title" />
      <TextField name="subtitle" label="Intro text" multiline />
    </Group>
  );
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const emptyImage = () => ({ src: "", width: 1, height: 1, blurDataURL: "" });

// ---------- Sections ----------

function SiteForm() {
  return (
    <>
      <Group title="Ministry">
        <Row>
          <TextField name="name" label="Full name" />
          <TextField name="shortName" label="Short name" description="Used in the footer, e.g. FDMG." />
        </Row>
        <TextField name="tagline" label="Tagline" description="Under the name in the top menu." />
        <TextField name="statement" label="Statement" multiline description="Shown in the footer." />
        <Row>
          <TextField name="overseer" label="General Overseer" />
          <TextField name="headquarters" label="Headquarters (country)" />
        </Row>
        <ImageField name="logo" label="Logo" preset="logo" description="Square works best. PNG keeps transparency." />
      </Group>
      <Group title="Contact details" description="Used in the contact section and footer.">
        <Row>
          <TextField name="email" label="Email" type="email" />
          <TextField name="phone" label="Phone" type="tel" />
        </Row>
      </Group>
      <Group title="Search engines & sharing" description="What Google and link previews show.">
        <TextField name="seoTitle" label="Page title" />
        <TextField name="seoDescription" label="Description" multiline />
      </Group>
    </>
  );
}

function NavigationForm() {
  return (
    <Group
      title="Menu links"
      description="Shown in the top menu and the footer. Link to a section with #home, #live, #about, #services, #quotes, #activities, #branches or #contact."
    >
      <ListField
        name="links"
        itemNoun="link"
        max={10}
        newItem={() => ({ label: "", href: "#" })}
        titleOf={(item) => str(item?.label)}
      >
        {(path) => (
          <Row>
            <TextField name={`${path}.label`} label="Label" />
            <TextField name={`${path}.href`} label="Link" placeholder="#contact" />
          </Row>
        )}
      </ListField>
    </Group>
  );
}

function HeroForm() {
  return (
    <>
      <Group title="Background image" description="The first thing visitors see. It's preloaded so it appears instantly.">
        <ImageField
          name="image"
          label="Image"
          preset="wide"
          description="Landscape, at least 1920px wide. Text sits on the left, so keep the subject centre or right."
        />
        <TextField
          name="imageAlt"
          label="Image description"
          description="Read aloud by screen readers, e.g. “Worshippers raising hands before a cross”."
        />
      </Group>
      <Group title="Text">
        <TextField name="badge" label="Badge" description="Small pill above the headline." />
        <TextField name="title" label="Headline" multiline rows={2} />
        <TextField name="subtitle" label="Intro text" multiline />
      </Group>
      <Group title="Buttons" description="Leave a label empty to hide that button.">
        <TextField
          name="primaryCta"
          label="Live button label"
          description="Opens the live service (shown only when a live video link is set)."
        />
        <Row>
          <TextField name="secondaryCta" label="Second button label" />
          <TextField name="secondaryHref" label="Second button link" placeholder="#contact" />
        </Row>
      </Group>
    </>
  );
}

function LiveForm() {
  return (
    <>
      <VisibleField />
      <Group title="Video">
        <TextField
          name="videoUrl"
          label="Facebook or YouTube link"
          placeholder="https://www.facebook.com/yourpage/videos/…"
          description="Paste the link to a video, a live stream or a YouTube channel (youtube.com/channel/…) — it is turned into a player automatically. Leave empty to hide the live section and buttons."
        />
        <TextField name="note" label="Note under the video" />
      </Group>
      <HeadingFields />
    </>
  );
}

function AboutForm() {
  return (
    <>
      <VisibleField />
      <HeadingFields />
      <Group title="Highlights" description="Short points shown as a list.">
        <ListField
          name="highlights"
          itemNoun="highlight"
          max={8}
          newItem={() => ({ text: "" })}
          titleOf={(item) => str(item?.text)}
        >
          {(path) => <TextField name={`${path}.text`} label="Text" />}
        </ListField>
      </Group>
      <Group title="General Overseer card">
        <ImageField name="overseerImage" label="Photo" preset="photo" aspect="aspect-square max-w-64" />
        <TextField name="overseerLabel" label="Label" description="Above the name (the name is set in Ministry details)." />
        <TextField name="overseerBio" label="Short bio" multiline />
      </Group>
    </>
  );
}

function ServicesForm() {
  const iconOptions = SERVICE_ICON_NAMES.map((name) => ({
    value: name,
    label: (
      <span className="flex items-center gap-2">
        <ServiceIcon name={name} className="size-4" /> {name.replace(/([a-z])([A-Z])/g, "$1 $2")}
      </span>
    ),
  }));
  return (
    <>
      <VisibleField />
      <HeadingFields />
      <Group title="Services">
        <ListField
          name="items"
          itemNoun="service"
          max={24}
          newItem={() => ({ icon: "Church", title: "", desc: "", time: "" })}
          titleOf={(item) => str(item?.title)}
        >
          {(path) => (
            <>
              <Row>
                <TextField name={`${path}.title`} label="Name" />
                <SelectField name={`${path}.icon`} label="Icon" options={iconOptions} />
              </Row>
              <TextField name={`${path}.desc`} label="Description" multiline rows={2} />
              <TextField name={`${path}.time`} label="When" placeholder="Sundays · 9:00 AM" />
            </>
          )}
        </ListField>
      </Group>
    </>
  );
}

function ScripturesForm() {
  return (
    <>
      <VisibleField />
      <HeadingFields />
      <Group title="Scriptures">
        <ListField
          name="items"
          itemNoun="scripture"
          max={24}
          newItem={() => ({ reference: "", text: "" })}
          titleOf={(item) => str(item?.reference)}
        >
          {(path) => (
            <>
              <TextField name={`${path}.reference`} label="Reference" placeholder="John 3:16" />
              <TextField name={`${path}.text`} label="Verse" multiline />
            </>
          )}
        </ListField>
      </Group>
    </>
  );
}

function ActivitiesForm() {
  return (
    <>
      <VisibleField />
      <HeadingFields />
      <Group title="Activities">
        <ListField
          name="items"
          itemNoun="activity"
          max={24}
          newItem={() => ({ image: emptyImage(), title: "", date: "", location: "", desc: "" })}
          titleOf={(item) => str(item?.title)}
        >
          {(path) => (
            <>
              <ImageField name={`${path}.image`} label="Photo" preset="photo" aspect="aspect-[4/3]" />
              <TextField name={`${path}.title`} label="Title" />
              <Row>
                <TextField name={`${path}.date`} label="Date" placeholder="Aug 12–16, 2026" />
                <TextField name={`${path}.location`} label="Location" />
              </Row>
              <TextField name={`${path}.desc`} label="Description" multiline rows={2} />
            </>
          )}
        </ListField>
      </Group>
    </>
  );
}

function BranchesForm() {
  return (
    <>
      <VisibleField />
      <HeadingFields />
      <Group title="Branches" description="Branch contacts also appear in the contact section and footer.">
        <ListField
          name="items"
          itemNoun="branch"
          max={30}
          newItem={() => ({ country: "", role: "Branch", address: "", contact: "", time: "", headquarters: false })}
          titleOf={(item) => str(item?.country)}
        >
          {(path) => (
            <>
              <Row>
                <TextField name={`${path}.country`} label="Country / city" />
                <TextField name={`${path}.role`} label="Label" placeholder="Branch" />
              </Row>
              <TextField name={`${path}.address`} label="Address" />
              <Row>
                <TextField name={`${path}.contact`} label="Phone" />
                <TextField name={`${path}.time`} label="Service time" placeholder="Sun · 9:00 AM" />
              </Row>
              <SwitchField name={`${path}.headquarters`} label="Headquarters" description="Highlights this branch." />
            </>
          )}
        </ListField>
      </Group>
    </>
  );
}

function ContactForm() {
  return (
    <>
      <VisibleField />
      <HeadingFields />
      <Group title="Details" description="Email and phone come from Ministry details.">
        <TextField name="address" label="Headquarters address" />
        <TextField name="branchContactsTitle" label="Branch contacts heading" />
        <TextField
          name="successMessage"
          label="Message after sending"
          multiline
          rows={2}
          description="Messages arrive under Messages in this admin."
        />
      </Group>
    </>
  );
}

function SocialsForm() {
  const platformOptions = SOCIAL_PLATFORM_IDS.map((id) => {
    const { Icon, label } = SOCIAL_PLATFORMS[id];
    return {
      value: id,
      label: (
        <span className="flex items-center gap-2">
          <Icon className="size-4" /> {label}
        </span>
      ),
    };
  });
  return (
    <>
      <VisibleField />
      <HeadingFields />
      <Group title="Links" description="Also shown as icons in the footer.">
        <ListField
          name="items"
          itemNoun="link"
          max={12}
          newItem={() => ({ platform: "facebook", label: "Facebook", href: "https://" })}
          titleOf={(item) => str(item?.label)}
        >
          {(path) => (
            <>
              <Row>
                <SelectField name={`${path}.platform`} label="Platform" options={platformOptions} />
                <TextField name={`${path}.label`} label="Label" />
              </Row>
              <TextField name={`${path}.href`} label="Link" placeholder="https://facebook.com/yourpage" />
            </>
          )}
        </ListField>
      </Group>
    </>
  );
}

function FooterForm() {
  return (
    <Group title="Footer">
      <Row>
        <TextField name="quickLinksTitle" label="Links heading" />
        <TextField name="branchesTitle" label="Branches heading" />
      </Row>
      <TextField name="contactTitle" label="Contact heading" />
      <TextField name="copyright" label="Copyright line" description="The © and current year are added automatically." />
    </Group>
  );
}

export const SECTION_FORMS: Record<SectionKey, () => ReactNode> = {
  site: SiteForm,
  navigation: NavigationForm,
  hero: HeroForm,
  live: LiveForm,
  about: AboutForm,
  services: ServicesForm,
  scriptures: ScripturesForm,
  activities: ActivitiesForm,
  branches: BranchesForm,
  contact: ContactForm,
  socials: SocialsForm,
  footer: FooterForm,
};
