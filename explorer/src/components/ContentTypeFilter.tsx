import { SegmentedControl } from "@radix-ui/themes";

interface ContentTypeFilterProps<TypeEnum extends string> {
  value: TypeEnum | undefined;
  onChange: (value: TypeEnum | undefined) => void;
  options: { value: TypeEnum; label: string }[];
  allLabel?: string;
}

function ContentTypeFilter<TypeEnum extends string>({
  value,
  onChange,
  options,
  allLabel = "All",
}: ContentTypeFilterProps<TypeEnum>): JSX.Element {
  return (
    <SegmentedControl.Root
      value={value ?? "All"}
      onValueChange={(v) => {
        onChange(v === "All" ? undefined : (v as TypeEnum));
      }}
    >
      <SegmentedControl.Item value="All">{allLabel}</SegmentedControl.Item>

      {options.map(({ value: optionValue, label }) => (
        <SegmentedControl.Item key={optionValue} value={optionValue}>
          {label}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  );
}

export default ContentTypeFilter;
