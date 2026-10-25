/** @jsxImportSource jsx-md */

import { Heading, Link, Paragraph } from "readme";

const readme = (
  <>
    <Heading level={1}>Chortle</Heading>
    <Paragraph>Tools for Pi.</Paragraph>

    <Paragraph>
      <Link href="packages/mise-to-pi">mise-to-pi</Link> turns Mise tasks into
      standalone Pi tool extensions.
    </Paragraph>
  </>
);

console.log(readme);
