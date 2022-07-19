import * as React from 'react';
import './style.css';
// import { Checkbox, CheckboxGroup } from '@chakra-ui/react';
import { Checkbox, Collapse } from 'antd';
import 'antd/dist/antd.css';
import data from './data';
import { RightOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

let allHeaderKeys: string[] = [];
const getNewNodes = (parents: string[], node: any) => {
  const currKey = [...parents, node.value];
  allHeaderKeys.push(node.value);
  const hasChildren = node.children?.length > 0;
  const newNode: any = {
    key: currKey,
    label: node.label,
    value: node.value,
  };
  if (hasChildren) {
    newNode.children = [];
    node.children.forEach((child) => {
      newNode.children.push(getNewNodes(currKey, child));
    });
  }
  return newNode;
};
const getBaseNodesMap = () => {
  const map: any = {};
  allHeaderKeys.forEach((key) => (map[key] = false));
  return map;
};

export default function App() {
  const newNodes = React.useMemo(() => getNewNodes([], data), []);

  const [activePanels, setActivePanels] =
    React.useState<string[]>(allHeaderKeys);
  const [checkNodes, setCheckNodes] =
    React.useState<Record<string, boolean>>(getBaseNodesMap);
  const [indeterminateNodes, setIndeterminateNodes] =
    React.useState<Record<string, boolean>>(getBaseNodesMap);

  const handleCollapseIconClick = (key: string) => {
    setActivePanels((prevState) => {
      if (!prevState.includes(key)) {
        return [...prevState, key];
      }

      return prevState.filter((u) => u !== key);
    });
  };

  const handleCheckboxClick = (event) => {
    const nodes = [...event.target.value] as string[];
    const checked = event.target.checked;
    const clickedNode = nodes[nodes.length - 1];
    const currentNodeStates = { ...checkNodes };
    const indeterminateStates = { ...indeterminateNodes };

    // if parent then select all
    if (clickedNode === newNodes.value) {
      for (const node in currentNodeStates) {
        currentNodeStates[node] = checked;
      }
    } else {
      let currNode: any = {};
      let children = newNodes.children || [];

      for (let i = 1; i < nodes.length; ++i) {
        currNode = children.find((u) => u.value === nodes[i]);
        children = currNode && currNode.children ? currNode.children : [];
      }
      // now currNode contains the clicked node
      let nodesToUpdate = [];

      const findNodesToUpdate = (node: any) => {
        nodesToUpdate.push(node);
        if (node.children) {
          node.children.forEach((child) => {
            nodesToUpdate.push(child);
            findNodesToUpdate(child);
          });
        } else {
          return;
        }
      };
      findNodesToUpdate(currNode);

      for (const node of nodesToUpdate) {
        currentNodeStates[node.value] = checked;
      }
    }

    setCheckNodes(currentNodeStates);

    // traverse all and update indeterminateStates
    const findIndeterminateNodes = (node: any) => {
      if (!node) return;

      if (node.value === newNodes.value) {
        let val = false;
        if (
          checked ||
          Object.values(currentNodeStates).reduce(
            (prev, curr) => prev || curr,
            false
          )
        )
          val = true;
        indeterminateStates[newNodes.value] = val;
      }

      if (node.children) {
        node.children.forEach((u) => findIndeterminateNodes(u));

        const anyCheckChild = node.children.findIndex(
          (n) => currentNodeStates[n.value] || indeterminateStates[n.value]
        );
        indeterminateStates[node.value] = anyCheckChild >= 0;
      }
    };
    findIndeterminateNodes(newNodes);

    setIndeterminateNodes(indeterminateStates);
  };

  const renderCheckBox = (node: any) => {
    const hasChildren = node.children?.length > 0;

    return (
      <Collapse
        ghost
        activeKey={activePanels}
        className={`level ${hasChildren ? '' : 'no-child-level'}`}
        key={node.value}
        expandIcon={(props: any) => (
          <RightOutlined
            rotate={activePanels.includes(props.panelKey) ? 90 : 0}
            onClick={() => handleCollapseIconClick(props.panelKey)}
          />
        )}
      >
        <Panel
          showArrow={hasChildren}
          header={
            <Checkbox
              indeterminate={
                checkNodes[node.value] ? false : indeterminateNodes[node.value]
              }
              checked={checkNodes[node.value]}
              onChange={handleCheckboxClick}
              value={node.key}
            >
              {node.label}
            </Checkbox>
          }
          className={`panel ${hasChildren ? '' : 'no-child-panel'}`}
          key={node.value}
        >
          {hasChildren && node.children.map((child) => renderCheckBox(child))}
        </Panel>
      </Collapse>
    );
  };

  return <div>{renderCheckBox(newNodes)}</div>;
}
