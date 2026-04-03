import React from 'react';
import { render } from '@testing-library/react-native';
import {
  PageShell,
  PageSectionCard,
  PageSectionHeader,
} from '../../../src/components/layout/PageShell';

describe('PageShell', () => {
  it('renders shell and section primitives consistently', () => {
    const { toJSON, getByText } = render(
      <PageShell title="Workspace" subtitle="Consistency test">
        <PageSectionCard>
          <PageSectionHeader title="Section" />
        </PageSectionCard>
      </PageShell>
    );

    expect(getByText('Workspace')).toBeTruthy();
    expect(getByText('Section')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
