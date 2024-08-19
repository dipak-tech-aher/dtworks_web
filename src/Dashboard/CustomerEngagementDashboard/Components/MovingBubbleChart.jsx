import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BubbleChart = (props) => {
    const svgRef = useRef();
    const chartData = props?.data?.chartData
    const labels = props?.data?.labels
    const updatedChartData = props?.data?.updatedChartData
    const updatedLabels = props?.data?.updatedLabels;

    console.log('chartData ', chartData)

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const width = 1000;
        const height = 600;
        svg.attr('width', width).attr('height', height);

        if (!svg.empty()) {

            const bubbleRadius = 5
            // const gravity = 0.1
            const chargeStrength = -15

            const charge = d3.forceManyBody()
                .strength(chargeStrength)
                .distanceMin(bubbleRadius + 1)
            const collide = d3.forceCollide(bubbleRadius)
            // const posX = d3.forceX(d => d.focus.x)
            //     .strength(gravity)
            // const posY = d3.forceY(d => d.focus.y)
            //     .strength(gravity)
            

            // function forceCluster() {
            //     const strength = .15;
            //     let nodes;

            //     function force(alpha) {
            //         const l = alpha * strength;       
            //         for (const d of nodes) {

            //             d.vx -= (d.x) * l;
            //             d.vy -= (d.y) * l;

            //         }
            //     }
            //     force.initialize = _ => nodes = _;

            //     return force;
            // }

            // const cluster_padding = 5;
            // const padding = 1
            // function forceCollide() {
            //     const alpha = 0.2; // fixed for greater rigidity!
            //     const padding1 = padding; // separation between same-color nodes
            //     const padding2 = cluster_padding; // separation between different-color nodes
            //     let nodes;
            //     let maxRadius;

            //     function force() {
            //         const quadtree = d3.quadtree(nodes, d => d.x, d => d.y);
            //         for (const d of nodes) {
            //             const r = d.r + maxRadius;
            //             const nx1 = d.x - r, ny1 = d.y - r;
            //             const nx2 = d.x + r, ny2 = d.y + r;

            //             quadtree.visit((q, x1, y1, x2, y2) => {
            //                 if (!q.length) do {
            //                     if (q.data !== d) {
            //                         const r = d.r + q.data.r + (d.focus.status === q.data.focus.status ? padding1 : padding2);
            //                         let x = d.x - q.data.x, y = d.y - q.data.y, l = Math.hypot(x, y);
            //                         if (l < r) {
            //                             l = (l - r) / l * alpha;
            //                             d.x -= x *= l
            //                             d.y -= y *= l;
            //                             q.data.x += x
            //                             q.data.y += y;
            //                         }
            //                     }
            //                 } while (q = q.next);
            //                 return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            //             });
            //         }
            //     }

            //     force.initialize = _ => maxRadius = d3.max(nodes = _, d => d.r) + Math.max(padding1, padding2);

            //     return force;
            // }      

            const circle = svg.append("g")
                .selectAll("circle")
                .data(chartData)
                .join("circle")
                .attr("id", d => `bubble-${d.index}`)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("fill", d => d.focus.color);

            circle.transition()
                .delay((d, i) => i * 5)
                .duration(800)
                .attrTween("r", d => {
                    const i = d3.interpolate(0, d.r);
                    return t => d.r = i(t);
                });

            svg.selectAll('.grp')
                .data(labels)
                .join("text")
                .attr("class", "grp")
                .attr("text-anchor", "middle")
                .attr("x", d => d.x)
                .attr("y", d => d.y - 70)
                .text(d => d.status);

            svg.selectAll('.grpcnt')
                .data(labels)
                .join("text")
                .attr("class", "grpcnt")
                .attr("text-anchor", "middle")
                .attr("x", d => d.x)
                .attr("y", d => d.y - 50)
                .text(d => d.cnt);

            const simulation = d3.forceSimulation(chartData)
                .force("x", d3.forceX(d => d.focus.x))
                .force("y", d3.forceY(d => d.focus.y))
                // .force("cluster", forceCluster())
                // .force("x", posX)
                // .force("y", posY)
                .force("charge", charge)
                // .force("cluster", charge)
                .force("collide", collide)
                // .force("collide", forceCollide())
                .alpha(.09)
                .alphaDecay(0);
            simulation.on("tick", () => {
                circle
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("fill", d => d.focus.color);
            });

        }

        return () => { svg.node(); }
    }, [chartData, labels]);

    return (
        <svg ref={svgRef} width="800" height="400"></svg>
    );
};

export default BubbleChart;
